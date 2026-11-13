import { randomUUID } from "node:crypto";
import { and, eq, inArray, isNull, ne } from "drizzle-orm";
import { db } from "../src/db";
import { room as roomTable, roomMember } from "../src/db/rooms";
import { normalizeRoomCode } from "../src/lib/room-code";
import type {
  ActionResult,
  RoomError,
  RoomResult,
} from "../src/lib/room-protocol";
import { generateRoomCode } from "./codes";
import { dropRacer, hostContext, isStillRacing, stopRace } from "./race";
import {
  broadcast,
  channel,
  GRACE_MS,
  rooms,
  toView,
  type AppServer,
  type AppSocket,
  type Member,
  type Room,
} from "./room-state";

export type { AppServer, Identity } from "./room-state";

const MAX_NAME_LENGTH = 20;

const fail = (error: RoomError): RoomResult => ({ ok: false, error });

function isUniqueViolation(e: unknown): boolean {
  const code = (e as { code?: string })?.code;
  const causeCode = (e as { cause?: { code?: string } })?.cause?.code;
  return code === "23505" || causeCode === "23505";
}

function cleanGuestName(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME_LENGTH);
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

async function removeMember(io: AppServer, room: Room, member: Member) {
  if (room.members.get(member.key) !== member) return;
  if (member.graceTimer) clearTimeout(member.graceTimer);
  room.members.delete(member.key);

  try {
    await db
      .update(roomMember)
      .set({ leftAt: new Date() })
      .where(eq(roomMember.id, member.id));
  } catch (e) {
    console.error("[rooms] failed to persist member leave", e);
  }

  if (room.members.size === 0) return closeRoom(io, room);

  if (room.hostKey === member.key) {
    const next = [...room.members.values()]
      .filter((m) => m.userId)
      .sort((a, b) => a.joinedAt - b.joinedAt)[0];
    if (!next?.userId) return closeRoom(io, room);
    room.hostKey = next.key;
    try {
      await db
        .update(roomTable)
        .set({ hostId: next.userId })
        .where(eq(roomTable.id, room.id));
    } catch (e) {
      console.error("[rooms] failed to persist host change", e);
    }
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
    const expire = () => {
      if (isStillRacing(room, member)) {
        member.graceTimer = setTimeout(expire, GRACE_MS);
        return;
      }
      void removeMember(io, room, member);
    };
    member.graceTimer = setTimeout(expire, GRACE_MS);
    broadcast(io, room);
  }
}

export async function closeRoomByHost(
  io: AppServer,
  socket: AppSocket,
): Promise<ActionResult> {
  const ctx = hostContext(socket);
  if (typeof ctx === "string") return { ok: false, error: ctx };
  if (ctx.room.status !== "lobby" && ctx.room.status !== "results") {
    return { ok: false, error: "bad_state" };
  }
  await closeRoom(io, ctx.room);
  return { ok: true };
}

export async function createRoom(
  io: AppServer,
  socket: AppSocket,
): Promise<RoomResult> {
  const { identity } = socket.data;
  if (!identity.userId) return fail("not_signed_in");

  await leaveRoom(io, socket, { immediate: true });

  const memberId = randomUUID();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode();
    try {
      const roomId = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(roomTable)
          .values({ code, hostId: identity.userId! })
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
        role: "racer",
        joinedAt: Date.now(),
        sockets: new Set(),
      };
      const room: Room = {
        id: roomId,
        code,
        hostKey: identity.key,
        status: "lobby",
        members: new Map([[identity.key, member]]),
        race: null,
      };
      rooms.set(code, room);
      attach(socket, room, member);
      return { ok: true, room: toView(room), you: member.id };
    } catch (e) {
      if (isUniqueViolation(e)) continue;
      console.error("[rooms] createRoom failed", e);
      return fail("server_error");
    }
  }
  return fail("server_error");
}

export async function joinRoom(
  io: AppServer,
  socket: AppSocket,
  rawCode: unknown,
  rawGuestName: unknown,
): Promise<RoomResult> {
  const code = normalizeRoomCode(rawCode);
  if (!code) return fail("bad_request");
  const room = rooms.get(code);
  if (!room) return fail("not_found");

  const { identity } = socket.data;
  if (socket.data.roomCode && socket.data.roomCode !== code) {
    await leaveRoom(io, socket, { immediate: true });
  }

  let member = room.members.get(identity.key);
  if (!member) {
    const name = identity.userId
      ? identity.name
      : cleanGuestName(rawGuestName) || identity.name;
    const created: Member = {
      id: randomUUID(),
      key: identity.key,
      userId: identity.userId,
      name,
      role: room.status === "lobby" ? "racer" : "spectator",
      joinedAt: Date.now(),
      sockets: new Set(),
    };
    room.members.set(identity.key, created);
    try {
      await db.insert(roomMember).values({
        id: created.id,
        roomId: room.id,
        userId: created.userId,
        guestName: created.userId ? null : created.name,
        role: created.role,
      });
    } catch (e) {
      if (room.members.get(identity.key) === created) {
        room.members.delete(identity.key);
      }
      console.error("[rooms] joinRoom failed", e);
      return fail("server_error");
    }
    if (rooms.get(code) !== room) return fail("not_found");
    member = created;
  }

  attach(socket, room, member);
  broadcast(io, room);
  return { ok: true, room: toView(room), you: member.id };
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
