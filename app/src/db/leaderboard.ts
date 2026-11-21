import { desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { raceResult } from "@/db/rooms";
import { user } from "@/db/schema";

export const LEADERBOARD_SIZE = 50;

export type LeaderboardSort = "wpm" | "wins";

export async function getLeaderboard(by: LeaderboardSort) {
  const bestWpm = sql<string | null>`max(${raceResult.wpm}) filter (where ${raceResult.outcome} = 'finished')`;
  const wins = sql<number>`count(*) filter (where ${raceResult.position} = 1 and ${raceResult.outcome} = 'finished')::int`;
  const rows = await db
    .select({
      id: user.id,
      name: sql<string>`coalesce(${user.displayUsername}, ${user.name})`,
      image: user.image,
      races: sql<number>`count(*)::int`,
      wins,
      bestWpm,
      accuracy: sql<string | null>`avg(${raceResult.accuracy})`,
    })
    .from(raceResult)
    .innerJoin(user, eq(user.id, raceResult.userId))
    .where(isNotNull(raceResult.userId))
    .groupBy(user.id)
    .having(by === "wins" ? sql`${wins} > 0` : sql`${bestWpm} is not null`)
    .orderBy(...(by === "wins" ? [desc(wins), desc(bestWpm)] : [desc(bestWpm), desc(wins)]))
    .limit(LEADERBOARD_SIZE);

  return rows.map((r) => ({
    ...r,
    bestWpm: r.bestWpm === null ? null : Number(r.bestWpm),
    accuracy: r.accuracy === null ? null : Number(r.accuracy),
  }));
}
