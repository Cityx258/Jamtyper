import { expect, test } from "bun:test";
import { applyBoosts, cutLastWords } from "../server/boosts";
import { createBots } from "../server/bots";
import { race, racer } from "./helpers";

const NOW = 1_000_000;

test("no boost when the race is close", () => {
  const a = racer({ position: 50 });
  const b = racer({ position: 45 });
  expect(applyBoosts(race([a, b]), NOW)).toBe(false);
  expect(a.boost).toBeNull();
  expect(b.boost).toBeNull();
});

test("the last racer far behind loses the last two words of their text", () => {
  const leader = racer({ position: 150 });
  const last = racer({ position: 10 });
  const r = race([leader, last]);
  expect(applyBoosts(r, NOW)).toBe(true);
  expect(last.position).toBe(10);
  expect(last.cut).toBe(10);
  expect(r.text.slice(0, r.text.length - last.cut).endsWith("word word")).toBe(true);
  expect(r.text[r.text.length - last.cut]).toBe(" ");
  expect(leader.cut).toBe(0);
  expect(last.boost?.kind).toBe("shortcut");
});

test("the shortcut waits for its cooldown", () => {
  const leader = racer({ position: 150 });
  const last = racer({ position: 10 });
  const r = race([leader, last]);
  applyBoosts(r, NOW);
  applyBoosts(r, NOW + 5_000);
  expect(last.cut).toBe(10);
  applyBoosts(r, NOW + 10_000);
  expect(last.cut).toBe(20);
});

test("the shortcut never cuts into the word being typed", () => {
  expect(cutLastWords("one two three four", 18, 2)).toBe(7);
  expect(cutLastWords("one two", 7, 2)).toBeNull();
  const leader = racer({ position: 199 });
  const last = racer({ position: 2 });
  const r = race([leader, last], {}, "one two three four");
  leader.position = 18;
  leader.outcome = "finished";
  expect(applyBoosts(r, NOW)).toBe(true);
  expect(last.cut).toBe(11);
  const late = racer({ position: 9 });
  const r2 = race([racer({ position: 18, outcome: "finished" }), late], {}, "one two three four");
  applyBoosts(r2, NOW);
  expect(late.cut).toBe(0);
});

test("a runaway human leader gets the spotlight fog", () => {
  const leader = racer({ position: 150 });
  const other = racer({ position: 10 });
  applyBoosts(race([leader, other]), NOW);
  expect(leader.boost?.kind).toBe("spotlight");
  expect(leader.boost!.until).toBeGreaterThan(NOW);
});

test("bots never get the fog", () => {
  const [bot] = createBots(1, new Set(), "impossible");
  bot.position = 150;
  const human = racer({ position: 10 });
  applyBoosts(race([bot, human]), NOW);
  expect(bot.boost).toBeNull();
});

test("expired badges are cleared", () => {
  const a = racer({ position: 50, boost: { kind: "shortcut", until: NOW - 1 } });
  const b = racer({ position: 50 });
  expect(applyBoosts(race([a, b]), NOW)).toBe(true);
  expect(a.boost).toBeNull();
});
