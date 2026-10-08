// Messages shared by the Socket.IO server (server/) and the browser client.

export type RoomStatus =
  | "lobby"
  | "countdown"
  | "racing"
  | "finishing"
  | "results"
  | "closed";

export interface MemberView {
  /** Opaque per-seat id, safe to show to other players. */
  id: string;
  name: string;
  role: "racer" | "spectator";
  isHost: boolean;
  /** False while the player is inside the reconnection grace period. */
  connected: boolean;
}

export interface RoomView {
  code: string;
  status: RoomStatus;
  members: MemberView[];
}

export type RoomError =
  | "not_signed_in"
  | "not_found"
  | "bad_request"
  | "server_error";

export type RoomResult =
  | { ok: true; room: RoomView; you: string }
  | { ok: false; error: RoomError };

export interface ClientToServerEvents {
  "room:create": (ack: (result: RoomResult) => void) => void;
  "room:join": (
    payload: { code: string; guestName?: string },
    ack: (result: RoomResult) => void,
  ) => void;
  "room:leave": (ack?: () => void) => void;
}

export interface ServerToClientEvents {
  "room:state": (room: RoomView) => void;
  "room:closed": () => void;
}
