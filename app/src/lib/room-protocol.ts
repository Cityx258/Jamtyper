export type RoomStatus =
  | "lobby"
  | "countdown"
  | "racing"
  | "finishing"
  | "results"
  | "closed";

import type { ErrorMode, SettingsView } from "./race-settings";
import type { NoteKind } from "./notes";
import type { Team } from "./teams";

export const VISIBILITIES = ["public", "semi_public", "private"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export type MemberRole = "racer" | "spectator";

export interface MemberView {
  id: string;
  name: string;
  role: MemberRole;
  isHost: boolean;
  isGuest: boolean;
  connected: boolean;
  watchRequested: boolean;
  team: Team;
  note: NoteKind;
}

export type RacerOutcome =
  | "racing"
  | "finished"
  | "forfeited"
  | "kicked"
  | "eliminated"
  | "timed_out";

export type BoostKind = "shortcut" | "spotlight";

export interface BoostView {
  kind: BoostKind;
  until: number;
}

export interface RacerView {
  id: string;
  name: string;
  progress: number;
  errors: number;
  isBot: boolean;
  team: Team | null;
  note: NoteKind;
  unlocked: NoteKind | null;
  samples: number[] | null;
  wpm: number;
  accuracy: number;
  outcome: RacerOutcome;
  place: number | null;
  timeMs: number | null;
  missed: MissedKeys;
  jump: number;
  boost: BoostView | null;
}

export interface RaceView {
  text: string | null;
  by: string | null;
  errorMode: ErrorMode;
  instantDeath: boolean;
  timeGoalSec: number;
  teams: boolean;
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
  settings: SettingsView;
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
  | "no_text"
  | "empty_team"
  | "kicked"
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
  errors?: number;
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
  "room:configure": (
    payload: Record<string, unknown>,
    ack: (result: ActionResult) => void,
  ) => void;
  "room:invite": (ack: (result: InviteResult) => void) => void;
  "member:watch": (
    payload: { watching: boolean },
    ack: (result: ActionResult) => void,
  ) => void;
  "member:approve": (
    payload: { memberId: string; approve: boolean },
    ack: (result: ActionResult) => void,
  ) => void;
  "member:kick": (
    payload: { memberId: string },
    ack: (result: ActionResult) => void,
  ) => void;
  "member:promote": (
    payload: { memberId: string },
    ack: (result: ActionResult) => void,
  ) => void;
  "member:team": (
    payload: { memberId: string; team: Team },
    ack: (result: ActionResult) => void,
  ) => void;
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
  "room:kicked": () => void;
  "race:positions": (racers: RacerView[]) => void;
}
