import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  RoomResult,
  ServerToClientEvents,
} from "./room-protocol";

export type AppClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppClientSocket | null = null;

// Guests are identified by a random id kept for the life of the browser tab, so a
// refresh reclaims the same seat. Accounts are identified by their session cookie.
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
