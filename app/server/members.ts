import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { roomMember } from "../src/db/rooms";
import type { ActionResult, RoomError } from "../src/lib/room-protocol";
import { context, hostContext } from "./race";
import {
  broadcast,
  findMember,
  type AppServer,
  type AppSocket,
  type Member,
} from "./room-state";

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
