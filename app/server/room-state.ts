import type { Server, Socket } from "socket.io";
import type {
  BoostView,
  ClientToServerEvents,
  InviteView,
  RoomSummary,
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
import { settingsView, type RaceSettings } from "../src/lib/race-settings";
import { unlockedNotes, type NoteKind } from "../src/lib/notes";
import type { Team } from "../src/lib/teams";
import { MIN_RACERS } from "../src/lib/bot-plan";
import type { BotState } from "./bots";

export const GRACE_MS = 30_000;
export { MIN_RACERS };

export interface Identity {
  key: string;
  userId: string | null;
  name: string;
  image: string | null;
  ip: string;
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
  image: string | null;
  watching: boolean;
  watchRequested: boolean;
  team: Team;
  note: NoteKind;
  wins: number;
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
  errors: number;
  missed: MissedKeys;
  outcome: RacerOutcome;
  doneAt: number | null;
  place: number | null;
  bot: BotState | null;
  team: Team | null;
  note: NoteKind;
  pitches: number[];
  unlocked: NoteKind | null;
  samples: number[];
  cut: number;
  extra: string;
  bonuses: number;
  boost: BoostView | null;
  record: boolean;
}

export interface Race {
  dbId: Promise<string | null> | null;
  text: string;
  by: string | null;
  settings: RaceSettings;
  startsAt: number;
  endsAt: number | null;
  closesAt: number | null;
  endedAt: number | null;
  racers: Map<string, Racer>;
  checkpoints: number;
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
  settings: RaceSettings;
  members: Map<string, Member>;
  banned: Set<string>;
  invites: Invite[];
  createdAt: number;
  race: Race | null;
}

export interface Invite {
  id: string;
  token: string;
  createdAt: number;
  usedBy: string | null;
  usedName: string | null;
  ip: string | null;
  revoked: boolean;
}

export const rooms = new Map<string, Room>();

export const channel = (code: string) => `room:${code}`;
export const EXPLORER = "explorer";
const EXPLORER_DELAY_MS = 300;

export function participants(room: Room): number {
  let racers = 0;
  for (const m of room.members.values()) if (!m.watching) racers++;
  return racers + room.settings.botLevels.length;
}

export const isFull = (room: Room) => participants(room) >= room.settings.capacity;

export const isJoinable = (room: Room) => room.status === "lobby" || room.status === "results";

export function findRoomOf(key: string): Room | undefined {
  for (const room of rooms.values()) if (room.members.has(key)) return room;
  return undefined;
}

export function roomSummary(room: Room): RoomSummary {
  const host = room.members.get(room.hostKey);
  return {
    code: room.code,
    host: host?.name ?? "",
    status: room.status,
    participants: participants(room),
    capacity: room.settings.capacity,
    language: room.settings.language,
    difficulty: room.settings.difficulty,
    source: room.settings.source,
    createdAt: room.createdAt,
  };
}

export const publicRooms = () =>
  [...rooms.values()]
    .filter((r) => r.visibility === "public")
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(roomSummary);

let explorerTimer: NodeJS.Timeout | undefined;

export function notifyExplorer(io: AppServer) {
  if (explorerTimer) return;
  explorerTimer = setTimeout(() => {
    explorerTimer = undefined;
    io.to(EXPLORER).emit("rooms:list", publicRooms());
  }, EXPLORER_DELAY_MS);
}

export function inviteViews(room: Room): InviteView[] {
  return room.invites
    .filter((i) => !i.revoked)
    .map((i) => ({ id: i.id, token: i.token, createdAt: i.createdAt, usedBy: i.usedName }));
}

export function pushInvites(io: AppServer, room: Room) {
  const host = room.members.get(room.hostKey);
  if (!host) return;
  const list = inviteViews(room);
  for (const id of host.sockets) io.to(id).emit("room:invites", list);
}

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

export function smallerTeam(room: Room): Team {
  let first = 0;
  for (const m of room.members.values()) first += m.team === 0 ? 1 : -1;
  return first > 0 ? 1 : 0;
}

export function balanceTeams(room: Room) {
  const members = [...room.members.values()].sort((a, b) => a.joinedAt - b.joinedAt);
  members.forEach((m, i) => (m.team = (i % 2) as Team));
}

export function racerWpm(race: Race, racer: Racer, now = Date.now()): number {
  const elapsed =
    racer.doneAt ?? Math.min(race.endedAt ?? now, race.endsAt ?? Infinity) - race.startsAt;
  if (elapsed <= 0) return 0;
  return Math.max(0, racer.position - racer.errors) / 5 / (elapsed / 60_000);
}

export function racerRawWpm(race: Race, racer: Racer, now = Date.now()): number {
  const elapsed =
    racer.doneAt ?? Math.min(race.endedAt ?? now, race.endsAt ?? Infinity) - race.startsAt;
  if (elapsed <= 0) return 0;
  return keystrokes(racer) / 5 / (elapsed / 60_000);
}

const keystrokes = (racer: Racer) => racer.position + racer.mistakes - racer.errors;

export function racerAccuracy(racer: Racer): number {
  const strokes = keystrokes(racer);
  return strokes === 0 ? 1 : (racer.position - racer.errors) / strokes;
}

export const racerText = (race: Race, racer: Racer) =>
  race.text.slice(0, race.text.length - racer.cut) + racer.extra;

export const racerEnd = (race: Race, racer: Racer) =>
  race.text.length - racer.cut + racer.extra.length;

export function racersView(race: Race, withSamples = false): RacerView[] {
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
      errors: r.errors,
      isBot: !!r.bot,
      team: r.team,
      note: r.note,
      pitches: r.pitches,
      unlocked: r.unlocked,
      samples: withSamples ? r.samples : null,
      wpm: Math.round(racerWpm(race, r, now)),
      rawWpm: Math.round(racerRawWpm(race, r, now)),
      mistakes: r.mistakes,
      record: r.record,
      accuracy: racerAccuracy(r),
      outcome: r.outcome,
      place: r.place,
      timeMs: r.outcome === "finished" ? r.doneAt : null,
      missed: r.missed,
      end: racerEnd(race, r),
      extra: r.extra,
      bonuses: r.bonuses,
      boost: r.boost,
    }));
}

function raceView(room: Room, race: Race): RaceView {
  return {
    text: race.text,
    by: race.by,
    errorMode: race.settings.errorMode,
    instantDeath: race.settings.instantDeath,
    timeGoalSec: race.settings.timeGoalSec,
    teams: race.settings.teams,
    length: race.text.length,
    startsAt: race.startsAt,
    endsAt: race.endsAt,
    closesAt: race.closesAt,
    serverNow: Date.now(),
    racers: racersView(race, room.status === "results"),
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
    settings: settingsView(room.settings),
    minRacers: MIN_RACERS,
    members: members.map((m) => ({
      id: m.id,
      name: m.name,
      role: memberRole(room, m),
      isHost: m.key === room.hostKey,
      isGuest: !m.userId,
      image: m.image,
      connected: m.sockets.size > 0,
      watchRequested: m.watchRequested,
      team: m.team,
      note: m.note,
      notes: unlockedNotes(m.wins),
    })),
    race: room.race ? raceView(room, room.race) : null,
  };
}

export function broadcast(io: AppServer, room: Room) {
  io.to(channel(room.code)).emit("room:state", toView(room));
  notifyExplorer(io);
}
