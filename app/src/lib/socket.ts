import { io, type Socket } from "socket.io-client";
import type {
  ActionResult,
  ClientToServerEvents,
  ProgressPayload,
  RoomResult,
  ServerToClientEvents,
} from "./room-protocol";

export type AppClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppClientSocket | null = null;

function guestId(): string {
  try {
    let id = sessionStorage.getItem("jt-guest-id");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("jt-guest-id", id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export function getSocket(): AppClientSocket {
  if (!socket) {
    socket = io({ autoConnect: false, auth: (cb) => cb({ guestId: guestId() }) });
  }
  return socket;
}

function connected(s: AppClientSocket): Promise<void> {
  if (s.connected) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const onConnect = () => {
      s.off("connect_error", onError);
      resolve();
    };
    const onError = (err: Error) => {
      s.off("connect", onConnect);
      reject(err);
    };
    s.once("connect", onConnect);
    s.once("connect_error", onError);
    s.connect();
  });
}

const ACK_TIMEOUT_MS = 8000;

export async function requestCreateRoom(): Promise<RoomResult> {
  const s = getSocket();
  await connected(s);
  return s.timeout(ACK_TIMEOUT_MS).emitWithAck("room:create");
}

export async function requestJoinRoom(
  code: string,
  guestName?: string,
): Promise<RoomResult> {
  const s = getSocket();
  await connected(s);
  return s.timeout(ACK_TIMEOUT_MS).emitWithAck("room:join", { code, guestName });
}

export async function requestLeaveRoom(): Promise<void> {
  const s = getSocket();
  if (!s.connected) return;
  await s.timeout(ACK_TIMEOUT_MS).emitWithAck("room:leave");
}

type HostAction = "race:start" | "race:cancel" | "race:again" | "race:forfeit" | "room:close";

export async function requestAction(event: HostAction): Promise<ActionResult> {
  const s = getSocket();
  if (!s.connected) return { ok: false, error: "server_error" };
  try {
    return await s.timeout(ACK_TIMEOUT_MS).emitWithAck(event);
  } catch {
    return { ok: false, error: "server_error" };
  }
}

export function sendProgress(progress: ProgressPayload) {
  getSocket().emit("race:progress", progress);
}
