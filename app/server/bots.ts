import { randomInt, randomUUID } from "node:crypto";
import type { BotLevel } from "../src/lib/race-settings";
import type { Race, Racer } from "./room-state";

const NAMES = [
  "Allegro",
  "Staccato",
  "Crescendo",
  "Vibrato",
  "Tempo",
  "Metronome",
  "Fermata",
  "Legato",
  "Presto",
  "Andante",
];

const LEVELS: Record<BotLevel, { wpm: number; typoRate: number }> = {
  easy: { wpm: 25, typoRate: 0.06 },
  medium: { wpm: 45, typoRate: 0.03 },
  expert: { wpm: 75, typoRate: 0.015 },
  impossible: { wpm: 140, typoRate: 0.003 },
};

const random = () => randomInt(1_000_000) / 1_000_000;

const PAUSE_COMPENSATION = 1.15;
const SENTENCE_END = /[.!?;:]/;

export interface BotState {
  cps: number;
  typoRate: number;
  carry: number;
  stallMs: number;
  pace: number;
  target: number;
}

export function createBots(
  count: number,
  taken: Set<string>,
  level: BotLevel,
): Racer[] {
  const { wpm, typoRate } = LEVELS[level];
  const names = NAMES.filter((n) => !taken.has(n));
  const bots: Racer[] = [];
  for (let i = 0; i < count; i++) {
    const name = names.length
      ? names.splice(randomInt(names.length), 1)[0]
      : `Bot ${i + 1}`;
    bots.push({
      id: `bot-${randomUUID()}`,
      userId: null,
      name,
      position: 0,
      mistakes: 0,
      errors: 0,
      missed: {},
      outcome: "racing",
      doneAt: null,
      place: null,
      jump: 0,
      bonus: 0,
      boost: null,
      lastBoostAt: 0,
      bot: {
        cps: ((wpm * 5) / 60) * PAUSE_COMPENSATION * (0.88 + random() * 0.24),
        typoRate,
        carry: 0,
        stallMs: 0,
        pace: 0.7,
        target: 1,
      },
    });
  }
  return bots;
}

export function stepBot(race: Race, racer: Racer, dtMs: number): boolean {
  const bot = racer.bot;
  if (!bot || racer.outcome !== "racing") return false;
  if (bot.stallMs > 0) {
    bot.stallMs -= dtMs;
    return false;
  }
  if (random() < dtMs / 1200) {
    bot.target = random() < 0.15 ? 1.35 + random() * 0.2 : 0.7 + random() * 0.6;
  }
  bot.pace += (bot.target - bot.pace) * Math.min(1, dtMs / 700);
  bot.carry += (bot.cps * bot.pace * dtMs) / 1000;
  let moved = false;
  while (bot.carry >= 1 && racer.position < race.text.length) {
    bot.carry -= 1;
    if (random() < bot.typoRate) {
      const key = race.text[racer.position];
      racer.mistakes++;
      racer.missed[key] = (racer.missed[key] ?? 0) + 1;
      if (race.settings.errorMode === "fix") {
        bot.carry = 0;
        bot.stallMs = 300 + randomInt(400);
        return true;
      }
      racer.errors++;
    }
    const typed = race.text[racer.position];
    racer.position++;
    moved = true;
    const pause =
      SENTENCE_END.test(typed) && random() < 0.5
        ? 250 + randomInt(550)
        : (typed === " " || typed === ",") && random() < 0.12
          ? 120 + randomInt(380)
          : 0;
    if (pause) {
      bot.carry = 0;
      bot.stallMs = pause;
      break;
    }
  }
  return moved;
}
