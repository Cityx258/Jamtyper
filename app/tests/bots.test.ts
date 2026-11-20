import { expect, test } from "bun:test";
import { createBots, LEVELS, stepBot } from "../server/bots";
import { BOT_LEVELS, type BotLevel } from "../src/lib/race-settings";
import { race, racer } from "./helpers";

const TEXT = "the quick brown fox jumps over the lazy dog ".repeat(300).trim();

test("bots get distinct names that players aren't using", () => {
  const bots = createBots(Array(5).fill("intermediate"), new Set(["Tempo", "Presto"]), 1);
  const names = bots.map((b) => b.name);
  expect(new Set(names).size).toBe(5);
  expect(names).not.toContain("Tempo");
  expect(names).not.toContain("Presto");
  expect(bots.every((b) => b.bot && b.id.startsWith("bot-"))).toBe(true);
});

function run(level: BotLevel, seed: number, errorMode: "fix" | "continue" = "continue") {
  const [bot] = createBots([level], new Set(), seed);
  const r = race([bot], { errorMode }, TEXT);
  const positions: number[] = [];
  for (let t = 0; t < 60_000; t += 100) {
    stepBot(r, bot, 100);
    positions.push(bot.position);
  }
  return { bot, positions, netWpm: (bot.position - bot.errors) / 5 };
}

test("the same seed replays the exact same race", () => {
  const a = run("expert", 42);
  const b = run("expert", 42);
  const c = run("expert", 43);
  expect(a.positions).toEqual(b.positions);
  expect(a.bot.name).toBe(b.bot.name);
  expect(a.positions).not.toEqual(c.positions);
});

test("each level types within its documented speed range", () => {
  for (const level of BOT_LEVELS) {
    const { minWpm, maxWpm } = LEVELS[level];
    for (const seed of [1, 2, 3, 4, 5]) {
      const wpm = run(level, seed).bot.position / 5;
      expect(wpm).toBeGreaterThan(minWpm * 0.75);
      expect(wpm).toBeLessThan(maxWpm * 1.25);
    }
  }
});

test("lower levels make more mistakes", () => {
  const rate = (level: BotLevel) => {
    const { bot } = run(level, 7);
    return bot.mistakes / bot.position;
  };
  expect(rate("noob")).toBeGreaterThan(rate("expert"));
  expect(rate("expert")).toBeGreaterThan(rate("impossible"));
});

test("speed varies during the race", () => {
  const { positions } = run("intermediate", 9);
  const perSecond = positions
    .filter((_, i) => i % 10 === 9)
    .map((p, i, all) => p - (all[i - 1] ?? 0));
  expect(Math.max(...perSecond) - Math.min(...perSecond)).toBeGreaterThan(2);
});

test("stepBot leaves humans and finished bots alone", () => {
  const human = racer();
  const [bot] = createBots(["intermediate"], new Set(), 1);
  bot.outcome = "finished";
  const r = race([human, bot]);
  expect(stepBot(r, human, 1000)).toBe(false);
  expect(stepBot(r, bot, 1000)).toBe(false);
});

test("in fix mode a bot's typo never counts as an error", () => {
  const { bot } = run("noob", 3, "fix");
  expect(bot.mistakes).toBeGreaterThan(0);
  expect(bot.errors).toBe(0);
});
