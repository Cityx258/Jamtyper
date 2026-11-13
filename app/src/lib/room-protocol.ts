export type RoomStatus =
  | "lobby"
  | "countdown"
  | "racing"
  | "finishing"
  | "results"
  | "closed";

export const VISIBILITIES = ["public", "semi_public", "private"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export interface MemberView {
  id: string;
  name: string;
  role: "racer" | "spectator";
  isHost: boolean;
  connected: boolean;
}

export type RacerOutcome =
  | "racing"
  | "finished"
  | "forfeited"
  | "kicked"
  | "timed_out";

export interface RacerView {
  id: string;
  name: string;
  progress: number;
  wpm: number;
  accuracy: number;
  outcome: RacerOutcome;
  place: number | null;
  missed: MissedKeys;
}

export interface RaceView {
  text: string | null;
  length: number;
  startsAt: number;
  endsAt: number;
  closesAt: number | null;
  serverNow: number;
  racers: RacerView[];
}

export interface RoomView {
  code: string;
  status: RoomStatus;
  visibility: Visibility;
  members: MemberView[];
  minRacers: number;
  race: RaceView | null;
}

export type RoomError =
  | "not_signed_in"
  | "not_found"
  | "bad_request"
  | "not_host"
  | "not_enough_racers"
  | "invite_required"
  | "no_public_room"
  | "bad_state"
  | "server_error";

export type RoomResult =
  | { ok: true; room: RoomView; you: string }
  | { ok: false; error: RoomError };

export type ActionResult = { ok: true } | { ok: false; error: RoomError };

export type QuickplayResult =
  | { ok: true; code: string }
  | { ok: false; error: RoomError };

export type InviteResult =
  | { ok: true; token: string }
  | { ok: false; error: RoomError };

export type MissedKeys = Record<string, number>;

export interface ProgressPayload {
  position: number;
  mistakes: number;
  missed: MissedKeys;
}

export interface ClientToServerEvents {
  "room:create": (ack: (result: RoomResult) => void) => void;
  "room:join": (
    payload: { code: string; guestName?: string; invite?: string },
    ack: (result: RoomResult) => void,
  ) => void;
  "room:quickplay": (ack: (result: QuickplayResult) => void) => void;
  "room:visibility": (
    payload: { visibility: Visibility },
    ack: (result: ActionResult) => void,
  ) => void;
  "room:invite": (ack: (result: InviteResult) => void) => void;
  "room:leave": (ack?: () => void) => void;
  "room:close": (ack: (result: ActionResult) => void) => void;
  "race:start": (ack: (result: ActionResult) => void) => void;
  "race:cancel": (ack: (result: ActionResult) => void) => void;
  "race:again": (ack: (result: ActionResult) => void) => void;
  "race:progress": (payload: ProgressPayload) => void;
  "race:forfeit": (ack: (result: ActionResult) => void) => void;
}

export interface ServerToClientEvents {
  "room:state": (room: RoomView) => void;
  "room:closed": () => void;
  "race:positions": (racers: RacerView[]) => void;
}
