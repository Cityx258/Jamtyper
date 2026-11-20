import { eq } from "drizzle-orm";
import { db } from "./index";
import { passage } from "./corpus";
import { race, raceResult, room } from "./rooms";
import { user } from "./schema";
import { QUOTES } from "./seed/passages";
import { auth } from "../lib/auth";
import { LANGUAGES } from "../lib/race-settings";

export const DEMO_PASSWORD = "jamtyper-demo";
const DEMO_USERS = ["demo", "melodie", "tempo"];
const RACES = 24;
const DAY = 24 * 60 * 60 * 1000;
const TEXT = "the quick brown fox jumps over the lazy dog while the band plays a slow tune";

async function seedCorpus() {
  const rows = LANGUAGES.flatMap((language) =>
    QUOTES[language].map((q) => ({
      language,
      theme: q.theme ?? null,
      body: q.text,
      author: q.by ?? null,
    })),
  );
  const inserted = await db
    .insert(passage)
    .values(rows)
    .onConflictDoNothing()
    .returning({ id: passage.id });
  console.log(`[seed] ${inserted.length} new passages (${rows.length} in the corpus)`);
}

async function seedUser(username: string): Promise<{ id: string; created: boolean }> {
  const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.username, username));
  if (existing) return { id: existing.id, created: false };
  const res = await auth.api.signUpEmail({
    body: {
      email: `${username}@users.invalid`,
      password: DEMO_PASSWORD,
      name: username,
      username,
    },
  });
  return { id: res.user.id, created: true };
}

function samplesFor(wpm: number, seconds: number): number[] {
  return Array.from({ length: seconds * 10 }, (_, i) => {
    const warmup = Math.min(1, (i + 5) / 40);
    return Math.max(0, Math.round(wpm * warmup + Math.sin(i / 7) * 4));
  });
}

async function seedHistory(players: { id: string; name: string }[]) {
  const [host] = players;
  const [demoRoom] = await db
    .insert(room)
    .values({ code: "DEMO23", hostId: host.id, visibility: "public", status: "closed", closedAt: new Date() })
    .onConflictDoNothing()
    .returning({ id: room.id });
  if (!demoRoom) return;

  const now = Date.now();
  for (let i = 0; i < RACES; i++) {
    const startedAt = new Date(now - (RACES - i) * 1.2 * DAY);
    const seconds = 40 + (i % 5) * 6;
    const [row] = await db
      .insert(race)
      .values({
        roomId: demoRoom.id,
        textBody: TEXT,
        startedAt,
        endedAt: new Date(startedAt.getTime() + seconds * 1000),
      })
      .returning({ id: race.id });

    const field = players.map((p, n) => {
      const base = n === 0 ? 32 + i * 1.4 : 45 - n * 6 + (i % 4) * 3;
      return { player: p, wpm: Math.round(base * 100) / 100 };
    });
    field.push({ player: { id: "", name: "Allegro" }, wpm: 38 + (i % 3) * 4 });
    field.sort((a, b) => b.wpm - a.wpm);

    await db.insert(raceResult).values(
      field.map((f, place) => ({
        raceId: row.id,
        userId: f.player.id || null,
        displayName: f.player.name,
        isBot: !f.player.id,
        position: place + 1,
        wpm: f.wpm,
        accuracy: 0.9 + ((i + place) % 9) / 100,
        missedKeys: { e: 1 + (i % 3), r: i % 2, t: 1 },
        outcome: "finished" as const,
        rawWpm: Math.round(f.wpm * 1.06 * 100) / 100,
        mistakes: 2 + ((i + place) % 5),
        progress: TEXT.length,
        textEnd: TEXT.length,
        timeMs: Math.round(((TEXT.length / 5 / f.wpm) * 60_000)),
        samples: samplesFor(f.wpm, seconds),
        note: "whole",
        pitches: [place % 5],
      })),
    );
  }
  console.log(`[seed] ${RACES} demo races`);
}

async function main() {
  await seedCorpus();
  const players = [];
  let fresh = false;
  for (const name of DEMO_USERS) {
    const u = await seedUser(name);
    players.push({ id: u.id, name });
    fresh ||= u.created && name === DEMO_USERS[0];
  }
  console.log(`[seed] demo accounts: ${DEMO_USERS.join(", ")} (password: ${DEMO_PASSWORD})`);
  if (fresh) await seedHistory(players);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
