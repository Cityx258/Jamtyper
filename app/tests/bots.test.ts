import { expect, test } from "bun:test";
import { createBots, stepBot } from "../server/bots";
import { race, racer } from "./helpers";

test("bots get distinct names that players aren't using", () => {
  const bots = createBots(5, new Set(["Tempo", "Presto"]), "medium");
  const names = bots.map((b) => b.name);
  expect(new Set(names).size).toBe(5);
  expect(names).not.toContain("Tempo");
  expect(names).not.toContain("Presto");
  expect(bots.every((b) => b.bot && b.id.startsWith("bot-"))).toBe(true);
});

function averageWpm(level: "easy" | "impossible") {
  const [bot] = createBots(1, new Set(), level);
  const r = race([bot], { errorMode: "continue" }, "abcd ".repeat(2000).trim());
  for (let t = 0; t < 60_000; t += 100) stepBot(r, bot, 100);
  return bot.position / 5;
}

test("harder bots type faster", () => {
  const easy = averageWpm("easy");
  const impossible = averageWpm("impossible");
  expect(easy).toBeGreaterThan(10);
  expect(easy).toBeLessThan(45);
  expect(impossible).toBeGreaterThan(90);
});

test("stepBot leaves humans and finished bots alone", () => {
  const human = racer();
  const [bot] = createBots(1, new Set(), "medium");
  bot.outcome = "finished";
  const r = race([human, bot]);
  expect(stepBot(r, human, 1000)).toBe(false);
  expect(stepBot(r, bot, 1000)).toBe(false);
});

test("in fix mode a bot's typo never counts as an error", () => {
  const [bot] = createBots(1, new Set(), "easy");
  const r = race([bot], { errorMode: "fix" }, "abcd ".repeat(2000).trim());
  for (let t = 0; t < 60_000; t += 100) stepBot(r, bot, 100);
  expect(bot.mistakes).toBeGreaterThan(0);
  expect(bot.errors).toBe(0);
});
