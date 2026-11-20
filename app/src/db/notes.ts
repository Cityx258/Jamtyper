import { and, eq, lte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "./index";
import { playerNote } from "./player";
import { raceResult } from "./rooms";
import { noteFor, unlockedNotes, type NoteKind } from "../lib/notes";

const other = alias(raceResult, "other");

export async function winCount(userId: string): Promise<number> {
  const humans = db
    .select({ n: sql<number>`count(*)` })
    .from(other)
    .where(and(eq(other.raceId, raceResult.raceId), eq(other.isBot, false)));
  const [row] = await db
    .select({ wins: sql<number>`count(*)::int` })
    .from(raceResult)
    .where(
      and(
        eq(raceResult.userId, userId),
        eq(raceResult.outcome, "finished"),
        lte(
          raceResult.position,
          sql`case when (${humans}) >= 6 then 3 when (${humans}) >= 4 then 2 else 1 end`,
        ),
      ),
    );
  return row?.wins ?? 0;
}

export async function chosenNote(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ note: playerNote.note })
    .from(playerNote)
    .where(eq(playerNote.userId, userId));
  return row?.note ?? null;
}

export async function noteState(userId: string): Promise<{ note: NoteKind; wins: number }> {
  const [wins, chosen] = await Promise.all([winCount(userId), chosenNote(userId)]);
  return { note: noteFor(wins, chosen), wins };
}

export async function currentNote(userId: string): Promise<NoteKind> {
  return (await noteState(userId)).note;
}

export async function chooseNote(userId: string, note: NoteKind): Promise<boolean> {
  if (!unlockedNotes(await winCount(userId)).includes(note)) return false;
  await db
    .insert(playerNote)
    .values({ userId, note })
    .onConflictDoUpdate({ target: playerNote.userId, set: { note } });
  return true;
}
