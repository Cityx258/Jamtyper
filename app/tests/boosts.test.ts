import { expect, test } from "bun:test";
import { applyBoosts } from "../server/boosts";
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

test("the last racer far behind skips two words, landing on a word start", () => {
  const leader = racer({ position: 150 });
  const last = racer({ position: 10 });
  const r = race([leader, last]);
  expect(applyBoosts(r, NOW)).toBe(true);
  expect(last.position).toBe(20);
  expect(r.text[last.position - 1]).toBe(" ");
  expect(last.jump).toBe(20);
  expect(last.bonus).toBe(10);
  expect(last.boost?.kind).toBe("shortcut");
});

test("the shortcut waits for its cooldown", () => {
  const leader = racer({ position: 150 });
  const last = racer({ position: 10 });
  const r = race([leader, last]);
  applyBoosts(r, NOW);
  applyBoosts(r, NOW + 5_000);
  expect(last.position).toBe(20);
  applyBoosts(r, NOW + 10_000);
  expect(last.position).toBe(30);
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
