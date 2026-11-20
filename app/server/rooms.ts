import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, eq, inArray, isNull, ne } from "drizzle-orm";
import { db } from "../src/db";
import { inviteLink, room as roomTable, roomMember } from "../src/db/rooms";
import { normalizeRoomCode } from "../src/lib/room-code";
import {
  VISIBILITIES,
  type ActionResult,
  type InviteResult,
  type InviteView,
  type QuickplayResult,
  type RoomError,
  type RoomResult,
  type Visibility,
} from "../src/lib/room-protocol";
import { DEFAULT_SETTINGS } from "../src/lib/race-settings";
import { cleanGuestName } from "../src/lib/username";
import { noteState } from "../src/db/notes";
import { generateRoomCode } from "./codes";
import { dropRacer, hostContext, stopRace } from "./race";
import { RateLimiter } from "./rate-limit";
import {
  broadcast,
  channel,
  findRoomOf,
  GRACE_MS,
  inviteViews,
  isFull,
  isJoinable,
  memberRole,
  notifyExplorer,
  participants,
  pushInvites,
  rooms,
  smallerTeam,
  toView,
  type AppServer,
  type AppSocket,
  type Invite,
  type Member,
  type Room,
} from "./room-state";

export type { AppServer, Identity } from "./room-state";

const MAX_INVITES_PER_ROOM = 100;
const INVITE_TTL_MS = 24 * 60 * 60 * 1000;
const INVITE_TOKEN = /^[A-Za-z0-9_-]{24}$/;
export const JOIN_FAILURES_PER_MINUTE = 10;

export const joinFailures = new RateLimiter(JOIN_FAILURES_PER_MINUTE, 60_000);

const fail = (error: RoomError, otherRoom?: string) =>
  ({ ok: false, error, ...(otherRoom ? { otherRoom } : {}) }) as const;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

function isUniqueViolation(e: unknown): boolean {
  const code = (e as { code?: string })?.code;
  const causeCode = (e as { cause?: { code?: string } })?.cause?.code;
  return code === "23505" || causeCode === "23505";
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function releaseStaleMembership(tx: Tx, userId: string | null) {
  if (!userId) return;
  await tx
    .update(roomMember)
    .set({ leftAt: new Date() })
    .where(and(eq(roomMember.userId, userId), isNull(roomMember.leftAt)));
}

function attach(socket: AppSocket, room: Room, member: Member) {
  if (member.graceTimer) {
    clearTimeout(member.graceTimer);
    member.graceTimer = undefined;
  }
  member.sockets.add(socket.id);
  socket.data.roomCode = room.code;
  void socket.join(channel(room.code));
}

async function closeRoom(io: AppServer, room: Room) {
  if (rooms.get(room.code) !== room) return;
  rooms.delete(room.code);
  if (room.race) stopRace(room.race);
  for (const m of room.members.values()) {
    if (m.graceTimer) clearTimeout(m.graceTimer);
  }
  io.to(channel(room.code)).emit("room:closed");
  io.in(channel(room.code)).socketsLeave(channel(room.code));
  notifyExplorer(io);
  try {
    const now = new Date();
    await db
      .update(roomMember)
      .set({ leftAt: now })
      .where(and(eq(roomMember.roomId, room.id), isNull(roomMember.leftAt)));
    await db
      .update(roomTable)
      .set({ status: "closed", closedAt: now })
      .where(eq(roomTable.id, room.id));
  } catch (e) {
    console.error("[rooms] failed to persist room close", e);
  }
}

export async function setHost(io: AppServer, room: Room, member: Member) {
  if (!member.userId) return;
  room.hostKey = member.key;
  pushInvites(io, room);
  try {
    await db.update(roomTable).set({ hostId: member.userId }).where(eq(roomTable.id, room.id));
  } catch (e) {
    console.error("[rooms] failed to persist host change", e);
  }
}

export function nextHost(room: Room): Member | undefined {
  return [...room.members.values()]
    .filter((m) => m.userId)
    .sort(
      (a, b) =>
        Number(b.sockets.size > 0) - Number(a.sockets.size > 0) || a.joinedAt - b.joinedAt,
    )[0];
}

export async function removeMember(io: AppServer, room: Room, member: Member) {
  if (room.members.get(member.key) !== member) return;
  if (member.graceTimer) clearTimeout(member.graceTimer);
  room.members.delete(member.key);

  try {
    await db.update(roomMember).set({ leftAt: new Date() }).where(eq(roomMember.id, member.id));
  } catch (e) {
    console.error("[rooms] failed to persist member leave", e);
  }

  if (room.members.size === 0) return closeRoom(io, room);

  if (room.hostKey === member.key) {
    const next = nextHost(room);
    if (!next) return closeRoom(io, room);
    await setHost(io, room, next);
  }
  dropRacer(io, room, member);
  broadcast(io, room);
}

export async function leaveRoom(
  io: AppServer,
  socket: AppSocket,
  { immediate }: { immediate: boolean },
) {
  const code = socket.data.roomCode;
  if (!code) return;
  socket.data.roomCode = undefined;
  void socket.leave(channel(code));

  const room = rooms.get(code);
  const member = room?.members.get(socket.data.identity.key);
  if (!room || !member) return;

  member.sockets.delete(socket.id);
  if (member.sockets.size > 0) return;

  if (immediate) {
    await removeMember(io, room, member);
  } else {
    member.graceTimer = setTimeout(() => void removeMember(io, room, member), GRACE_MS);
    broadcast(io, room);
  }
}

async function leaveEverywhere(io: AppServer, key: string) {
  const other = findRoomOf(key);
  const member = other?.members.get(key);
  if (!other || !member) return;
  for (const id of member.sockets) {
    const s = io.sockets.sockets.get(id);
    if (!s) continue;
    s.data.roomCode = undefined;
    void s.leave(channel(other.code));
    s.emit("room:moved");
  }
  member.sockets.clear();
  await removeMember(io, other, member);
}

export async function closeRoomByHost(io: AppServer, socket: AppSocket): Promise<ActionResult> {
  const ctx = hostContext(socket);
  if (typeof ctx === "string") return { ok: false, error: ctx };
  if (!isJoinable(ctx.room)) return { ok: false, error: "bad_state" };
  await closeRoom(io, ctx.room);
  return { ok: true };
}

const field = (payload: unknown, key: string): unknown =>
  payload && typeof payload === "object" ? (payload as Record<string, unknown>)[key] : undefined;

export async function createRoom(
  io: AppServer,
  socket: AppSocket,
  payload: unknown,
): Promise<RoomResult> {
  const { identity } = socket.data;
  if (!identity.userId) return fail("not_signed_in");
  const raw = field(payload, "visibility");
  const visibility: Visibility = VISIBILITIES.includes(raw as Visibility)
    ? (raw as Visibility)
    : "semi_public";

  const other = findRoomOf(identity.key);
  if (other) {
    if (field(payload, "leaveOther") !== true) return fail("in_other_room", other.code);
    await leaveEverywhere(io, identity.key);
  }

  const memberId = randomUUID();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode();
    try {
      const roomId = await db.transaction(async (tx) => {
        await releaseStaleMembership(tx, identity.userId);
        const [created] = await tx
          .insert(roomTable)
          .values({ code, hostId: identity.userId!, visibility })
          .returning({ id: roomTable.id });
        await tx.insert(roomMember).values({
          id: memberId,
          roomId: created.id,
          userId: identity.userId,
          role: "racer",
        });
        return created.id;
      });

      const member: Member = {
        id: memberId,
        key: identity.key,
        userId: identity.userId,
        name: identity.name,
        image: identity.image,
        watching: false,
        watchRequested: false,
        team: 0,
        ...(await noteState(identity.userId!)),
        joinedAt: Date.now(),
        sockets: new Set(),
      };
      const room: Room = {
        id: roomId,
        code,
        hostKey: identity.key,
        status: "lobby",
        visibility,
        settings: DEFAULT_SETTINGS,
        members: new Map([[identity.key, member]]),
        banned: new Set(),
        invites: [],
        createdAt: Date.now(),
        race: null,
      };
      rooms.set(code, room);
      attach(socket, room, member);
      notifyExplorer(io);
      return { ok: true, room: toView(room), you: member.id };
    } catch (e) {
      if (!isUniqueViolation(e)) {
        console.error("[rooms] createRoom failed", e);
        return fail("server_error");
      }
      if (findRoomOf(identity.key)) return fail("in_other_room", findRoomOf(identity.key)!.code);
    }
  }
  return fail("server_error");
}

function findInvite(room: Room, raw: unknown): Invite | null {
  if (typeof raw !== "string" || !INVITE_TOKEN.test(raw)) return null;
  return room.invites.find((i) => i.token === raw && !i.revoked) ?? null;
}

export async function joinRoom(
  io: AppServer,
  socket: AppSocket,
  payload: unknown,
): Promise<RoomResult> {
  const { identity } = socket.data;
  if (joinFailures.limited(identity.ip)) return fail("too_many_attempts");
  const refuse = (error: RoomError) => {
    joinFailures.hit(identity.ip);
    return fail(error);
  };

  const code = normalizeRoomCode(field(payload, "code"));
  if (!code) return refuse("bad_request");
  const room = rooms.get(code);
  if (!room) return refuse("not_found");

  let member = room.members.get(identity.key);
  if (!member) {
    const other = findRoomOf(identity.key);
    if (other) {
      if (field(payload, "leaveOther") !== true) return fail("in_other_room", other.code);
      await leaveEverywhere(io, identity.key);
    }
    if (room.banned.has(identity.key)) return fail("kicked");
    if (!isJoinable(room)) return fail("race_in_progress");

    let invite: Invite | null = null;
    if (room.visibility === "private") {
      invite = findInvite(room, field(payload, "invite"));
      if (!invite) return refuse("invite_required");
      if (invite.ip && invite.ip !== identity.ip) return fail("invite_used");
    }

    const name = identity.userId ? identity.name : cleanGuestName(identity.name);
    if (!name) return fail("bad_name");

    const created: Member = {
      id: randomUUID(),
      key: identity.key,
      userId: identity.userId,
      name,
      image: identity.image,
      watching: isFull(room),
      watchRequested: false,
      team: smallerTeam(room),
      ...(identity.userId
        ? await noteState(identity.userId)
        : { note: "whole" as const, wins: 0 }),
      joinedAt: Date.now(),
      sockets: new Set(),
    };
    room.members.set(identity.key, created);
    try {
      await db.transaction(async (tx) => {
        await releaseStaleMembership(tx, created.userId);
        await tx.insert(roomMember).values({
          id: created.id,
          roomId: room.id,
          userId: created.userId,
          guestName: created.userId ? null : created.name,
          role: memberRole(room, created),
        });
        if (!invite) return;
        await tx
          .update(inviteLink)
          .set({ usedAt: new Date(), usedBy: created.id, usedIp: identity.ip })
          .where(and(eq(inviteLink.roomId, room.id), eq(inviteLink.tokenHash, hashToken(invite.token))));
      });
    } catch (e) {
      if (room.members.get(identity.key) === created) room.members.delete(identity.key);
      if (isUniqueViolation(e)) return fail("in_other_room");
      console.error("[rooms] joinRoom failed", e);
      return fail("server_error");
    }
    if (rooms.get(code) !== room) return fail("not_found");
    if (invite) {
      invite.ip = identity.ip;
      invite.usedBy = created.id;
      invite.usedName = created.name;
      pushInvites(io, room);
    }
    member = created;
  }

  attach(socket, room, member);
  broadcast(io, room);
  return { ok: true, room: toView(room), you: member.id };
}

export function pickQuickplayRoom(all: Iterable<Room>, key: string): Room | undefined {
  return [...all]
    .filter((r) => r.visibility === "public" && isJoinable(r) && !isFull(r) && !r.banned.has(key))
    .sort(
      (a, b) =>
        a.settings.capacity - participants(a) - (b.settings.capacity - participants(b)) ||
        a.createdAt - b.createdAt,
    )[0];
}

export function quickplay(socket: AppSocket): QuickplayResult {
  const { key } = socket.data.identity;
  const current = findRoomOf(key);
  if (current?.visibility === "public") return { ok: true, code: current.code };
  const pick = pickQuickplayRoom(rooms.values(), key);
  return pick ? { ok: true, code: pick.code } : fail("no_public_room");
}

export async function setVisibility(
  io: AppServer,
  socket: AppSocket,
  payload: unknown,
): Promise<ActionResult> {
  const ctx = hostContext(socket);
  if (typeof ctx === "string") return fail(ctx);
  const visibility = field(payload, "visibility");
  if (!VISIBILITIES.includes(visibility as Visibility)) return fail("bad_request");
  const { room } = ctx;
  room.visibility = visibility as Visibility;
  broadcast(io, room);
  try {
    await db.update(roomTable).set({ visibility: room.visibility }).where(eq(roomTable.id, room.id));
  } catch (e) {
    console.error("[rooms] failed to persist visibility", e);
  }
  return { ok: true };
}

export async function createInvite(io: AppServer, socket: AppSocket): Promise<InviteResult> {
  const ctx = hostContext(socket);
  if (typeof ctx === "string") return fail(ctx);
  const { room, member } = ctx;
  if (room.invites.length >= MAX_INVITES_PER_ROOM) return fail("bad_state");
  const token = randomBytes(18).toString("base64url");
  const [row] = await db
    .insert(inviteLink)
    .values({
      roomId: room.id,
      tokenHash: hashToken(token),
      createdBy: member.userId,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    })
    .returning({ id: inviteLink.id });
  room.invites.push({
    id: row.id,
    token,
    createdAt: Date.now(),
    usedBy: null,
    usedName: null,
    ip: null,
    revoked: false,
  });
  pushInvites(io, room);
  return { ok: true, token };
}

export function listInvites(socket: AppSocket): InviteView[] {
  const ctx = hostContext(socket);
  return typeof ctx === "string" ? [] : inviteViews(ctx.room);
}

export function revokeInvitesOf(io: AppServer, room: Room, member: Member) {
  const used = room.invites.filter((i) => i.usedBy === member.id && !i.revoked);
  if (used.length === 0) return;
  for (const i of used) i.revoked = true;
  pushInvites(io, room);
  db.update(inviteLink)
    .set({ revokedAt: new Date() })
    .where(inArray(inviteLink.id, used.map((i) => i.id)))
    .catch((e) => console.error("[rooms] failed to revoke invites", e));
}

export async function closeStaleRooms() {
  const open = await db
    .select({ id: roomTable.id })
    .from(roomTable)
    .where(ne(roomTable.status, "closed"));
  if (open.length === 0) return;
  const ids = open.map((r) => r.id);
  const now = new Date();
  await db
    .update(roomMember)
    .set({ leftAt: now })
    .where(and(inArray(roomMember.roomId, ids), isNull(roomMember.leftAt)));
  await db
    .update(roomTable)
    .set({ status: "closed", closedAt: now })
    .where(inArray(roomTable.id, ids));
  console.log(`[rooms] closed ${ids.length} room(s) left over from a restart`);
}
