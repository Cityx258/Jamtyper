import { randomUUID } from "node:crypto";
import { NOTES } from "../src/lib/notes";
import type { BotLevel } from "../src/lib/race-settings";
import { racerEnd, racerText, type Race, type Racer } from "./room-state";
import { randomPitches } from "../src/lib/melody";
import { rngInt, seededRng, type Rng } from "../src/lib/rng";

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

export const LEVELS: Record<BotLevel, { minWpm: number; maxWpm: number; typoRate: number }> = {
  noob: { minWpm: 10, maxWpm: 20, typoRate: 0.12 },
  beginner: { minWpm: 20, maxWpm: 35, typoRate: 0.08 },
  intermediate: { minWpm: 35, maxWpm: 60, typoRate: 0.05 },
  expert: { minWpm: 70, maxWpm: 100, typoRate: 0.02 },
  impossible: { minWpm: 140, maxWpm: 170, typoRate: 0.005 },
};

const PAUSE_COMPENSATION = 1.15;
const SENTENCE_END = /[.!?;:]/;
const HARD_CHAR = /[^a-z ]/;
const HARD_CHAR_COST = 1.6;
const FOG_SLOWDOWN = 2;

export interface BotState {
  rng: Rng;
  cps: number;
  typoRate: number;
  carry: number;
  stallMs: number;
  pace: number;
  target: number;
}

export function createBots(
  levels: BotLevel[],
  taken: Set<string>,
  seed: number,
): Racer[] {
  const pickRng = seededRng(seed);
  const names = NAMES.filter((n) => !taken.has(n));
  return levels.map((level, i) => {
    const rng = seededRng(seed + (i + 1) * 0x9e3779b1);
    const { minWpm, maxWpm, typoRate } = LEVELS[level];
    const wpm = minWpm + rng() * (maxWpm - minWpm);
    const name = names.length
      ? names.splice(rngInt(pickRng, names.length), 1)[0]
      : `Bot ${i + 1}`;
    const note = NOTES[rngInt(rng, NOTES.length)];
    return {
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
      team: null,
      note,
      pitches: randomPitches(note, rng),
      unlocked: null,
      samples: [],
      cut: 0,
      extra: "",
      bonuses: 0,
      boost: null,
      bot: {
        rng,
        cps: ((wpm * 5) / 60) * PAUSE_COMPENSATION,
        typoRate,
        carry: 0,
        stallMs: 0,
        pace: 0.7,
        target: 1,
      },
    };
  });
}

export function stepBot(race: Race, racer: Racer, dtMs: number, now = Date.now()): boolean {
  const bot = racer.bot;
  if (!bot || racer.outcome !== "racing") return false;
  const { rng } = bot;
  if (bot.stallMs > 0) {
    bot.stallMs -= dtMs;
    return false;
  }
  if (rng() < dtMs / 1200) {
    bot.target = rng() < 0.15 ? 1.35 + rng() * 0.2 : 0.7 + rng() * 0.6;
  }
  bot.pace += (bot.target - bot.pace) * Math.min(1, dtMs / 700);
  bot.carry += (bot.cps * bot.pace * dtMs) / 1000;
  let moved = false;
  const text = racerText(race, racer);
  const fogged = racer.boost?.kind === "fog" && racer.boost.until > now ? FOG_SLOWDOWN : 1;
  while (racer.position < racerEnd(race, racer)) {
    const key = text[racer.position];
    const cost = (HARD_CHAR.test(key) ? HARD_CHAR_COST : 1) * fogged;
    if (bot.carry < cost) break;
    bot.carry -= cost;
    if (rng() < bot.typoRate) {
      racer.mistakes++;
      racer.missed[key] = (racer.missed[key] ?? 0) + 1;
      if (race.settings.errorMode === "fix") {
        bot.carry = 0;
        bot.stallMs = 300 + rngInt(rng, 400);
        return true;
      }
      racer.errors++;
    }
    racer.position++;
    moved = true;
    const pause =
      SENTENCE_END.test(key) && rng() < 0.5
        ? 250 + rngInt(rng, 550)
        : (key === " " || key === ",") && rng() < 0.12
          ? 120 + rngInt(rng, 380)
          : 0;
    if (pause) {
      bot.carry = 0;
      bot.stallMs = pause;
      break;
    }
  }
  return moved;
}
