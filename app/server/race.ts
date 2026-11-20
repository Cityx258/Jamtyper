import { randomInt } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../src/db";
import {
  race as raceTable,
  raceResult,
  room as roomTable,
} from "../src/db/rooms";
import type {
  ActionResult,
  MissedKeys,
  RacerOutcome,
  RoomError,
  RoomStatus,
} from "../src/lib/room-protocol";
import {
  racerEnd,
  balanceTeams,
  broadcast,
  channel,
  MIN_RACERS,
  racerAccuracy,
  racerRawWpm,
  racersView,
  racerWpm,
  rooms,
  type AppServer,
  type AppSocket,
  type Member,
  type Race,
  type Racer,
  type Room,
} from "./room-state";
import { mergeSettings, settingsView } from "../src/lib/race-settings";
import { generateText } from "../src/lib/texts";
import { createBots, stepBot } from "./bots";
import { corpus } from "./corpus";
import { applyBoosts } from "./boosts";
import { sampleRace, sampleRacer } from "./samples";
import { randomPitches } from "../src/lib/melody";
import { botPlan } from "../src/lib/bot-plan";
import { newlyUnlocked, winningPlaces } from "../src/lib/notes";
import { noteState, winCount } from "../src/db/notes";

export const COUNTDOWN_MS = 3_000;
export const CLOSING_MS = 30_000;
const MAX_CHARS_PER_SECOND = 25;
const TICK_MS = 100;
const MAX_WPM = 9999.99;
const MAX_MISSED_KEYS = 64;

const ok: ActionResult = { ok: true };
const fail = (error: RoomError): ActionResult => ({ ok: false, error });

type Context = { room: Room; member: Member };

export function context(socket: AppSocket): Context | null {
  const code = socket.data.roomCode;
  const room = code ? rooms.get(code) : undefined;
  const member = room?.members.get(socket.data.identity.key);
  return room && member ? { room, member } : null;
}

export function hostContext(socket: AppSocket): Context | RoomError {
  const ctx = context(socket);
  if (!ctx) return "not_found";
  if (ctx.room.hostKey !== ctx.member.key) return "not_host";
  return ctx;
}

const isLive = (status: RoomStatus) =>
  status === "racing" || status === "finishing";

function setStatus(room: Room, status: RoomStatus) {
  room.status = status;
  db.update(roomTable)
    .set({ status })
    .where(eq(roomTable.id, room.id))
    .catch((e) => console.error("[race] failed to persist room status", e));
}

export function stopRace(race: Race) {
  race.timers.forEach(clearTimeout);
  race.timers = [];
  if (race.ticker) clearInterval(race.ticker);
  race.ticker = undefined;
}

function backToLobby(io: AppServer, room: Room) {
  if (room.race) stopRace(room.race);
  room.race = null;
  setStatus(room, "lobby");
  broadcast(io, room);
}

export function startRace(io: AppServer, socket: AppSocket): ActionResult {
  const ctx = hostContext(socket);
  if (typeof ctx === "string") return fail(ctx);
  const { room } = ctx;
  if (room.status !== "lobby") return fail("bad_state");

  const entrants = [...room.members.values()].filter(
    (m) => !m.watching && m.sockets.size > 0,
  );
  const settings = room.settings;
  if (entrants.length === 0) return fail("not_enough_racers");
  const sizes: [number, number] = [0, 0];
  for (const m of entrants) sizes[m.team]++;
  const plan = botPlan(sizes, settings);
  if (entrants.length + plan.length < MIN_RACERS) return fail("not_enough_racers");
  if (settings.teams) {
    for (const b of plan) if (b.team !== null) sizes[b.team]++;
    if (sizes.includes(0)) return fail("empty_team");
  }

  const generated = generateText(settings, corpus());
  if (!generated) return fail("no_text");

  const startsAt = Date.now() + COUNTDOWN_MS;
  const race: Race = {
    dbId: null,
    text: generated.text,
    by: generated.by,
    settings,
    startsAt,
    endsAt: settings.timeLimitSec ? startsAt + settings.timeLimitSec * 1000 : null,
    closesAt: null,
    endedAt: null,
    racers: new Map(
      entrants.map((m) => [
        m.id,
        {
          id: m.id,
          userId: m.userId,
          name: m.name,
          position: 0,
          mistakes: 0,
          errors: 0,
          missed: {},
          outcome: "racing",
          doneAt: null,
          place: null,
          bot: null,
          team: settings.teams ? m.team : null,
          note: m.note,
          pitches: randomPitches(m.note),
          unlocked: null,
          samples: [],
          cut: 0,
          extra: "",
          bonuses: 0,
          boost: null,
          record: false,
        },
      ]),
    ),
    checkpoints: 0,
    dirty: false,
    timers: [],
  };
  const names = new Set(entrants.map((m) => m.name));
  const bots = createBots(
    plan.map((b) => b.level),
    names,
    randomInt(2 ** 31),
  );
  bots.forEach((bot, i) => {
    bot.team = settings.teams ? plan[i].team : null;
    race.racers.set(bot.id, bot);
  });
  room.race = race;
  setStatus(room, "countdown");
  race.timers.push(setTimeout(() => beginRacing(io, room, race), COUNTDOWN_MS));
  broadcast(io, room);
  return ok;
}

function beginRacing(io: AppServer, room: Room, race: Race) {
  if (room.race !== race || room.status !== "countdown") return;
  setStatus(room, "racing");
  if (race.endsAt !== null) {
    const endsAt = race.endsAt;
    race.timers.push(setTimeout(() => void endRace(io, room, race), endsAt - Date.now()));
  }
  let last = Date.now();
  race.ticker = setInterval(() => {
    const now = Date.now();
    const dt = now - last;
    last = now;
    for (const racer of race.racers.values()) {
      if (room.race !== race || !isLive(room.status)) return;
      if (!stepBot(race, racer, dt, now)) continue;
      race.dirty = true;
      if (race.settings.instantDeath && racer.mistakes > 0) {
        settle(io, room, race, racer, "eliminated");
      } else if (racer.position >= racerEnd(race, racer)) {
        settle(io, room, race, racer, "finished");
      }
    }
    sampleRace(race, now);
    if (race.settings.boosts && applyBoosts(race, now)) race.dirty = true;
    if (!race.dirty) return;
    race.dirty = false;
    io.to(channel(room.code)).emit("race:positions", racersView(race));
  }, TICK_MS);
  race.dbId = db
    .insert(raceTable)
    .values({
      roomId: room.id,
      textBody: race.text,
      settings: { ...settingsView(race.settings), closingMs: CLOSING_MS },
      startedAt: new Date(race.startsAt),
    })
    .returning({ id: raceTable.id })
    .then(
      ([row]) => row.id,
      (e) => {
        console.error("[race] failed to persist race start", e);
        return null;
      },
    );
  broadcast(io, room);
}

export function configureRoom(
  io: AppServer,
  socket: AppSocket,
  payload: unknown,
): ActionResult {
  const ctx = hostContext(socket);
  if (typeof ctx === "string") return fail(ctx);
  const { room } = ctx;
  if (room.status !== "lobby" && room.status !== "results") {
    return fail("bad_state");
  }
  const before = room.settings.teams;
  room.settings = mergeSettings(room.settings, payload);
  if (room.settings.teams && !before) balanceTeams(room);
  broadcast(io, room);
  db.update(roomTable)
    .set({ settings: room.settings })
    .where(eq(roomTable.id, room.id))
    .catch((e) => console.error("[race] failed to persist settings", e));
  return ok;
}

export function cancelRace(io: AppServer, socket: AppSocket): ActionResult {
  const ctx = hostContext(socket);
  if (typeof ctx === "string") return fail(ctx);
  if (ctx.room.status !== "countdown") return fail("bad_state");
  backToLobby(io, ctx.room);
  return ok;
}

export function raceAgain(io: AppServer, socket: AppSocket): ActionResult {
  const ctx = hostContext(socket);
  if (typeof ctx === "string") return fail(ctx);
  if (ctx.room.status !== "results") return fail("bad_state");
  backToLobby(io, ctx.room);
  return ok;
}

const isCount = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 0;

function cleanMissed(raw: unknown, mistakes: number): MissedKeys | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const entries = Object.entries(raw);
  if (entries.length > MAX_MISSED_KEYS) return null;
  let total = 0;
  for (const [key, count] of entries) {
    if ([...key].length !== 1 || !isCount(count)) return null;
    total += count;
  }
  return total <= mistakes ? Object.fromEntries(entries) : null;
}

function mergeMissed(a: MissedKeys, b: MissedKeys): MissedKeys {
  const merged = { ...a };
  for (const [key, count] of Object.entries(b)) {
    merged[key] = Math.max(merged[key] ?? 0, count);
  }
  return merged;
}

export function recordProgress(
  io: AppServer,
  socket: AppSocket,
  payload: unknown,
) {
  const ctx = context(socket);
  const race = ctx?.room.race;
  if (!ctx || !race || !isLive(ctx.room.status)) return;
  const racer = race.racers.get(ctx.member.id);
  if (!racer || racer.outcome !== "racing") return;

  const { position, mistakes, missed, errors = 0 } = (payload ?? {}) as Record<
    string,
    unknown
  >;
  if (!isCount(position) || !isCount(mistakes) || !isCount(errors)) return;
  if (errors > position) return;
  const missedKeys = cleanMissed(missed, mistakes);
  if (!missedKeys) return;
  const elapsed = Date.now() - race.startsAt;
  const cap = Math.ceil((elapsed / 1000) * MAX_CHARS_PER_SECOND) + 5;
  if (
    position < racer.position ||
    position > racerEnd(race, racer) ||
    position > cap
  ) {
    return;
  }

  racer.position = position;
  racer.errors = race.settings.errorMode === "continue" ? errors : 0;
  racer.mistakes = Math.max(racer.mistakes, mistakes);
  racer.missed = mergeMissed(racer.missed, missedKeys);
  race.dirty = true;
  if (race.settings.instantDeath && racer.mistakes > 0) {
    settle(io, ctx.room, race, racer, "eliminated");
  } else if (position === racerEnd(race, racer)) {
    settle(io, ctx.room, race, racer, "finished");
  }
}

export function forfeit(io: AppServer, socket: AppSocket): ActionResult {
  const ctx = context(socket);
  if (!ctx) return fail("not_found");
  const race = ctx.room.race;
  const racer = race?.racers.get(ctx.member.id);
  if (!race || !racer || !isLive(ctx.room.status) || racer.outcome !== "racing") {
    return fail("bad_state");
  }
  settle(io, ctx.room, race, racer, "forfeited");
  return ok;
}

export function kickRacer(io: AppServer, room: Room, member: Member) {
  const race = room.race;
  const racer = race?.racers.get(member.id);
  if (race && racer && isLive(room.status) && racer.outcome === "racing") {
    settle(io, room, race, racer, "kicked");
  }
}

export function dropRacer(io: AppServer, room: Room, member: Member) {
  const race = room.race;
  const racer = race?.racers.get(member.id);
  if (!race || !racer) return;
  if (room.status === "countdown") {
    race.racers.delete(member.id);
    if (race.racers.size < MIN_RACERS) backToLobby(io, room);
    return;
  }
  if (isLive(room.status) && racer.outcome === "racing") {
    settle(io, room, race, racer, "forfeited");
  }
}

function settle(
  io: AppServer,
  room: Room,
  race: Race,
  racer: Racer,
  outcome: Exclude<RacerOutcome, "racing" | "timed_out">,
) {
  const now = Date.now();
  sampleRacer(race, racer, now);
  racer.outcome = outcome;
  racer.doneAt = now - race.startsAt;
  race.dirty = true;
  const racers = [...race.racers.values()];
  if (outcome === "finished") {
    racer.place = racers.filter((r) => r.outcome === "finished").length;
  }

  if (!racers.some((r) => !r.bot && r.outcome === "racing")) {
    void endRace(io, room, race);
    return;
  }
  if (outcome === "finished" && room.status === "racing") {
    setStatus(room, "finishing");
    race.closesAt = Math.min(now + CLOSING_MS, race.endsAt ?? Infinity);
    race.timers.push(
      setTimeout(() => void endRace(io, room, race), race.closesAt - now),
    );
  }
  broadcast(io, room);
}

export function compareRacers(race: Race) {
  const progress = (r: Racer) => r.position / racerEnd(race, r);
  return (a: Racer, b: Racer) =>
    outcomeRank[a.outcome] - outcomeRank[b.outcome] ||
    (a.outcome === "finished"
      ? (a.doneAt ?? 0) - (b.doneAt ?? 0)
      : progress(b) - progress(a));
}

const outcomeRank: Record<RacerOutcome, number> = {
  finished: 0,
  racing: 1,
  timed_out: 1,
  forfeited: 2,
  kicked: 2,
  eliminated: 2,
};

async function endRace(io: AppServer, room: Room, race: Race) {
  if (room.race !== race || !isLive(room.status)) return;
  stopRace(race);
  race.endedAt = Math.min(Date.now(), race.endsAt ?? Infinity);

  const ranked = [...race.racers.values()];
  for (const r of ranked) {
    if (r.outcome === "racing") r.outcome = "timed_out";
  }
  ranked.sort(compareRacers(race));
  ranked.forEach((r, i) => (r.place = i + 1));

  setStatus(room, "results");
  broadcast(io, room);
  if (!(await saveResults(race, ranked))) return;
  const records = ranked.some((r) => r.record);
  const unlocks = await announceUnlocks(room, race).catch((e) => {
    console.error("[race] failed to check unlocked notes", e);
    return false;
  });
  if ((records || unlocks) && room.race === race) broadcast(io, room);
}

const round2 = (n: number) => Math.min(Math.round(n * 100) / 100, MAX_WPM);

async function markRecords(race: Race, ranked: Racer[]) {
  const humans = ranked.filter((r) => r.userId && r.outcome === "finished");
  if (humans.length === 0) return;
  const rows = await db
    .select({ userId: raceResult.userId, best: sql<string | null>`max(${raceResult.wpm})` })
    .from(raceResult)
    .where(
      and(
        inArray(raceResult.userId, humans.map((r) => r.userId!)),
        eq(raceResult.outcome, "finished"),
      ),
    )
    .groupBy(raceResult.userId);
  const best = new Map(rows.map((r) => [r.userId, Number(r.best ?? 0)]));
  for (const r of humans) {
    r.record = round2(racerWpm(race, r)) > (best.get(r.userId) ?? 0);
  }
}

async function announceUnlocks(room: Room, race: Race): Promise<boolean> {
  let changed = false;
  const places = winningPlaces([...race.racers.values()].filter((r) => !r.bot).length);
  for (const r of race.racers.values()) {
    if (!r.userId || !r.place || r.place > places || r.outcome !== "finished") continue;
    const wins = await winCount(r.userId);
    r.unlocked = newlyUnlocked(wins - 1, wins);
    const member = [...room.members.values()].find((m) => m.id === r.id);
    if (member) Object.assign(member, await noteState(r.userId));
    changed = true;
  }
  return changed;
}

async function saveResults(race: Race, ranked: Racer[]): Promise<boolean> {
  const raceId = await race.dbId;
  if (!raceId) return false;
  try {
    await markRecords(race, ranked);
    await db.transaction(async (tx) => {
      await tx.insert(raceResult).values(
        ranked.map((r) => ({
          raceId,
          userId: r.userId,
          displayName: r.name,
          position: r.place ?? ranked.length,
          wpm: round2(racerWpm(race, r)),
          rawWpm: round2(racerRawWpm(race, r)),
          accuracy: Math.round(racerAccuracy(r) * 10_000) / 10_000,
          missedKeys: r.missed,
          outcome: r.outcome as Exclude<RacerOutcome, "racing">,
          isBot: !!r.bot,
          mistakes: r.mistakes,
          errors: r.errors,
          bonuses: r.bonuses,
          progress: r.position,
          textEnd: racerEnd(race, r),
          timeMs: r.outcome === "finished" ? r.doneAt : null,
          samples: r.samples,
          note: r.note,
          pitches: r.pitches,
          team: r.team,
          record: r.record,
        })),
      );
      await tx
        .update(raceTable)
        .set({ endedAt: new Date(race.endedAt ?? Date.now()) })
        .where(eq(raceTable.id, raceId));
    });
    return true;
  } catch (e) {
    console.error("[race] failed to persist results", e);
    return false;
  }
}
