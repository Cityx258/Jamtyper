import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { roomMember } from "../src/db/rooms";
import type { ActionResult, RoomError } from "../src/lib/room-protocol";
import { context, hostContext, kickRacer } from "./race";
import {
  broadcast,
  channel,
  findMember,
  type AppServer,
  type AppSocket,
  type Member,
} from "./room-state";
import { removeMember, setHost } from "./rooms";

const ok: ActionResult = { ok: true };
const fail = (error: RoomError): ActionResult => ({ ok: false, error });

function persistRole(member: Member) {
  db.update(roomMember)
    .set({ role: member.watching ? "spectator" : "racer" })
    .where(eq(roomMember.id, member.id))
    .catch((e) => console.error("[members] failed to persist role", e));
}

const field = (payload: unknown, key: string): unknown =>
  payload && typeof payload === "object"
    ? (payload as Record<string, unknown>)[key]
    : undefined;

export function setWatching(
  io: AppServer,
  socket: AppSocket,
  payload: unknown,
): ActionResult {
  const ctx = context(socket);
  if (!ctx) return fail("not_found");
  const watching = field(payload, "watching");
  if (typeof watching !== "boolean") return fail("bad_request");
  const { room, member } = ctx;
  if (room.status !== "lobby") return fail("bad_state");

  if (!watching) {
    member.watching = false;
    member.watchRequested = false;
  } else if (room.hostKey === member.key) {
    member.watching = true;
    member.watchRequested = false;
  } else {
    member.watchRequested = true;
  }
  persistRole(member);
  broadcast(io, room);
  return ok;
}

export function answerWatchRequest(
  io: AppServer,
  socket: AppSocket,
  payload: unknown,
): ActionResult {
  const ctx = hostContext(socket);
  if (typeof ctx === "string") return fail(ctx);
  const approve = field(payload, "approve");
  const target = findMember(ctx.room, field(payload, "memberId"));
  if (!target || typeof approve !== "boolean") return fail("bad_request");
  if (!target.watchRequested) return fail("bad_state");

  target.watchRequested = false;
  if (approve) target.watching = true;
  persistRole(target);
  broadcast(io, ctx.room);
  return ok;
}

export async function kickMember(
  io: AppServer,
  socket: AppSocket,
  payload: unknown,
): Promise<ActionResult> {
  const ctx = hostContext(socket);
  if (typeof ctx === "string") return fail(ctx);
  const { room } = ctx;
  const target = findMember(room, field(payload, "memberId"));
  if (!target || target.key === room.hostKey) return fail("bad_request");

  room.banned.add(target.key);
  kickRacer(io, room, target);
  for (const id of target.sockets) {
    const s = io.sockets.sockets.get(id);
    if (!s) continue;
    s.data.roomCode = undefined;
    void s.leave(channel(room.code));
    s.emit("room:kicked");
  }
  target.sockets.clear();
  await removeMember(io, room, target);
  return ok;
}

export async function promoteMember(
  io: AppServer,
  socket: AppSocket,
  payload: unknown,
): Promise<ActionResult> {
  const ctx = hostContext(socket);
  if (typeof ctx === "string") return fail(ctx);
  const target = findMember(ctx.room, field(payload, "memberId"));
  if (!target || !target.userId) return fail("bad_request");
  if (target.key === ctx.room.hostKey) return ok;

  await setHost(ctx.room, target);
  if (target.watchRequested) {
    target.watchRequested = false;
    target.watching = true;
    persistRole(target);
  }
  broadcast(io, ctx.room);
  return ok;
}
