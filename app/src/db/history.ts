import { asc, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { race, raceResult } from "@/db/rooms";
import { isNote } from "@/lib/notes";
import type { MissedKeys, RacerOutcome, RacerView, RaceView } from "@/lib/room-protocol";
import { isTeam } from "@/lib/teams";

export const HISTORY_PAGE_SIZE = 15;

export async function getHistory(userId: string, page: number) {
  const offset = (page - 1) * HISTORY_PAGE_SIZE;
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        raceId: raceResult.raceId,
        startedAt: race.startedAt,
        position: raceResult.position,
        racers: sql<number>`(select count(*)::int from ${raceResult} r2 where r2.race_id = ${raceResult.raceId})`,
        wpm: raceResult.wpm,
        accuracy: raceResult.accuracy,
        outcome: raceResult.outcome,
        record: raceResult.record,
      })
      .from(raceResult)
      .innerJoin(race, eq(race.id, raceResult.raceId))
      .where(eq(raceResult.userId, userId))
      .orderBy(desc(race.startedAt))
      .limit(HISTORY_PAGE_SIZE)
      .offset(offset),
    db.select({ total: count() }).from(raceResult).where(eq(raceResult.userId, userId)),
  ]);
  return { rows, total, pages: Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE)) };
}

type SavedSettings = {
  errorMode?: unknown;
  instantDeath?: unknown;
  timeGoalSec?: unknown;
  teams?: unknown;
};

export async function getArchivedRace(
  raceId: string,
  userId: string,
): Promise<{ race: RaceView; you: string } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(raceId)) return null;
  const [found] = await db.select().from(race).where(eq(race.id, raceId));
  if (!found) return null;
  const rows = await db
    .select()
    .from(raceResult)
    .where(eq(raceResult.raceId, raceId))
    .orderBy(asc(raceResult.position));
  const mine = rows.find((r) => r.userId === userId);
  if (!mine) return null;

  const settings = (found.settings ?? {}) as SavedSettings;
  const racers: RacerView[] = rows.map((r) => ({
    id: r.id,
    name: r.displayName,
    progress: r.progress,
    errors: r.errors,
    isBot: r.isBot,
    team: isTeam(r.team) ? r.team : null,
    note: isNote(r.note) ? r.note : "whole",
    pitches: r.pitches.length ? r.pitches : [0],
    unlocked: null,
    samples: r.samples,
    wpm: Math.round(r.wpm),
    rawWpm: Math.round(r.rawWpm),
    mistakes: r.mistakes,
    record: r.record,
    accuracy: r.accuracy,
    outcome: r.outcome as RacerOutcome,
    place: r.position,
    timeMs: r.timeMs,
    missed: r.missedKeys as MissedKeys,
    end: r.textEnd || found.textBody.length,
    extra: "",
    bonuses: r.bonuses,
    boost: null,
  }));

  return {
    you: mine.id,
    race: {
      text: found.textBody,
      by: null,
      errorMode: settings.errorMode === "continue" ? "continue" : "fix",
      instantDeath: settings.instantDeath === true,
      timeGoalSec: typeof settings.timeGoalSec === "number" ? settings.timeGoalSec : 0,
      teams: settings.teams === true,
      length: found.textBody.length,
      startsAt: found.startedAt.getTime(),
      endsAt: found.endedAt?.getTime() ?? null,
      closesAt: null,
      serverNow: found.endedAt?.getTime() ?? found.startedAt.getTime(),
      racers,
    },
  };
}
