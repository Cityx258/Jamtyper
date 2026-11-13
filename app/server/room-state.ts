import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  MemberRole,
  MissedKeys,
  RacerOutcome,
  RacerView,
  RaceView,
  RoomStatus,
  RoomView,
  ServerToClientEvents,
  Visibility,
} from "../src/lib/room-protocol";

export const GRACE_MS = 30_000;
export const MIN_RACERS = 2;

export interface Identity {
  key: string;
  userId: string | null;
  name: string;
}

interface SocketData {
  identity: Identity;
  roomCode?: string;
}

export type AppServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;
export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

export interface Member {
  id: string;
  key: string;
  userId: string | null;
  name: string;
  watching: boolean;
  watchRequested: boolean;
  joinedAt: number;
  sockets: Set<string>;
  graceTimer?: NodeJS.Timeout;
}

export interface Racer {
  id: string;
  userId: string | null;
  name: string;
  position: number;
  mistakes: number;
  missed: MissedKeys;
  outcome: RacerOutcome;
  doneAt: number | null;
  place: number | null;
}

export interface Race {
  dbId: Promise<string | null> | null;
  text: string;
  startsAt: number;
  endsAt: number;
  closesAt: number | null;
  endedAt: number | null;
  racers: Map<string, Racer>;
  dirty: boolean;
  timers: NodeJS.Timeout[];
  ticker?: NodeJS.Timeout;
}

export interface Room {
  id: string;
  code: string;
  hostKey: string;
  status: RoomStatus;
  visibility: Visibility;
  members: Map<string, Member>;
  banned: Set<string>;
  invitesIssued: number;
  race: Race | null;
}

export const rooms = new Map<string, Room>();

export const channel = (code: string) => `room:${code}`;

export function memberRole(room: Room, member: Member): MemberRole {
  if (room.race && room.status !== "lobby") {
    return room.race.racers.has(member.id) ? "racer" : "spectator";
  }
  return member.watching ? "spectator" : "racer";
}

export function findMember(room: Room, id: unknown): Member | undefined {
  if (typeof id !== "string") return undefined;
  for (const m of room.members.values()) if (m.id === id) return m;
  return undefined;
}

export function racerWpm(race: Race, racer: Racer, now = Date.now()): number {
  const elapsed =
    racer.doneAt ?? Math.min(race.endedAt ?? now, race.endsAt) - race.startsAt;
  if (elapsed <= 0) return 0;
  return racer.position / 5 / (elapsed / 60_000);
}

export function racerAccuracy(racer: Racer): number {
  const strokes = racer.position + racer.mistakes;
  return strokes === 0 ? 1 : racer.position / strokes;
}

export function racersView(race: Race): RacerView[] {
  const now = Date.now();
  return [...race.racers.values()]
    .sort(
      (a, b) =>
        (a.place ?? Infinity) - (b.place ?? Infinity) || b.position - a.position,
    )
    .map((r) => ({
      id: r.id,
      name: r.name,
      progress: r.position,
      wpm: Math.round(racerWpm(race, r, now)),
      accuracy: racerAccuracy(r),
      outcome: r.outcome,
      place: r.place,
      missed: r.missed,
    }));
}

function raceView(room: Room, race: Race): RaceView {
  return {
    text: room.status === "countdown" ? null : race.text,
    length: race.text.length,
    startsAt: race.startsAt,
    endsAt: race.endsAt,
    closesAt: race.closesAt,
    serverNow: Date.now(),
    racers: racersView(race),
  };
}

export function toView(room: Room): RoomView {
  const members = [...room.members.values()].sort(
    (a, b) => a.joinedAt - b.joinedAt,
  );
  return {
    code: room.code,
    status: room.status,
    visibility: room.visibility,
    minRacers: MIN_RACERS,
    members: members.map((m) => ({
      id: m.id,
      name: m.name,
      role: memberRole(room, m),
      isHost: m.key === room.hostKey,
      connected: m.sockets.size > 0,
      watchRequested: m.watchRequested,
    })),
    race: room.race ? raceView(room, room.race) : null,
  };
}

export function broadcast(io: AppServer, room: Room) {
  io.to(channel(room.code)).emit("room:state", toView(room));
}
