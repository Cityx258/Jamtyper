import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { race, raceResult } from "@/db/rooms";
import type { MissedKeys } from "@/lib/room-protocol";

const RECENT_LIMIT = 10;

export async function getProfile(userId: string) {
  const [summaryRows, recent, keyRows] = await Promise.all([
    db
      .select({
        races: sql<number>`count(*)::int`,
        wins: sql<number>`count(*) filter (where ${raceResult.position} = 1 and ${raceResult.outcome} = 'finished')::int`,
        bestWpm: sql<string | null>`max(${raceResult.wpm}) filter (where ${raceResult.outcome} = 'finished')`,
        avgWpm: sql<string | null>`avg(${raceResult.wpm}) filter (where ${raceResult.outcome} = 'finished')`,
        avgAccuracy: sql<string | null>`avg(${raceResult.accuracy})`,
      })
      .from(raceResult)
      .where(eq(raceResult.userId, userId)),
    db
      .select({
        id: raceResult.id,
        startedAt: race.startedAt,
        position: raceResult.position,
        racers: sql<number>`(select count(*)::int from ${raceResult} r2 where r2.race_id = ${raceResult.raceId})`,
        wpm: raceResult.wpm,
        accuracy: raceResult.accuracy,
        outcome: raceResult.outcome,
      })
      .from(raceResult)
      .innerJoin(race, eq(race.id, raceResult.raceId))
      .where(eq(raceResult.userId, userId))
      .orderBy(desc(race.startedAt))
      .limit(RECENT_LIMIT),
    db.execute<{ key: string; total: number }>(sql`
      select k.key, sum(k.value::int)::int as total
      from ${raceResult}, jsonb_each_text(${raceResult.missedKeys}) as k
      where ${raceResult.userId} = ${userId}
      group by k.key
    `),
  ]);

  const summary = summaryRows[0];
  const num = (v: string | null) => (v === null ? null : Number(v));
  const missed: MissedKeys = Object.fromEntries(
    keyRows.rows.map((r) => [r.key, Number(r.total)]),
  );

  return {
    races: summary?.races ?? 0,
    wins: summary?.wins ?? 0,
    bestWpm: num(summary?.bestWpm ?? null),
    avgWpm: num(summary?.avgWpm ?? null),
    avgAccuracy: num(summary?.avgAccuracy ?? null),
    recent,
    missed,
  };
}
