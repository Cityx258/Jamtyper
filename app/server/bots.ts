import { randomInt, randomUUID } from "node:crypto";
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

const BOT_WPM = 45;

export interface BotState {
  cps: number;
  carry: number;
}

export function createBots(count: number, taken: Set<string>): Racer[] {
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
      bot: { cps: (BOT_WPM * 5) / 60, carry: 0 },
    });
  }
  return bots;
}

export function stepBot(race: Race, racer: Racer, dtMs: number): boolean {
  const bot = racer.bot;
  if (!bot || racer.outcome !== "racing") return false;
  bot.carry += (bot.cps * dtMs) / 1000;
  const chars = Math.floor(bot.carry);
  if (chars === 0) return false;
  bot.carry -= chars;
  racer.position = Math.min(race.text.length, racer.position + chars);
  return true;
}
