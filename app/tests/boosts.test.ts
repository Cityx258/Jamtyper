import { expect, test } from "bun:test";
import { applyBoosts, cutLastWords, MAX_BONUSES } from "../server/boosts";
import { createBots, stepBot } from "../server/bots";
import { racerEnd, racerText } from "../server/room-state";
import { race, racer } from "./helpers";

const NOW = 1_000_000;
const only = (kind: string) => () => (kind === "shortcut" ? 0 : kind === "extra" ? 0.5 : 0.99);

test("no boost before the leader reaches 25%", () => {
  const a = racer({ position: 40 });
  const b = racer({ position: 0 });
  const r = race([a, b]);
  expect(applyBoosts(r, NOW)).toBe(false);
  expect(b.bonuses).toBe(0);
});

test("the last racer gets a boost when the leader passes a checkpoint", () => {
  const leader = racer({ position: 60 });
  const last = racer({ position: 50 });
  const r = race([leader, last]);
  expect(applyBoosts(r, NOW)).toBe(true);
  expect(last.bonuses).toBe(1);
  expect(leader.bonuses).toBe(0);
  expect(r.checkpoints).toBe(1);
  expect(applyBoosts(r, NOW + 1000)).toBe(false);
  expect(last.bonuses).toBe(1);
});

test("racers more than 25% behind get a boost even if not last", () => {
  const leader = racer({ position: 160 });
  const middle = racer({ position: 50 });
  const close = racer({ position: 150 });
  const last = racer({ position: 10 });
  applyBoosts(race([leader, middle, close, last]), NOW);
  expect(middle.bonuses).toBe(1);
  expect(last.bonuses).toBe(1);
  expect(close.bonuses).toBe(0);
});

test("a racer gets at most 3 boosts", () => {
  const leader = racer({ position: 0 });
  const last = racer({ position: 0, bonuses: MAX_BONUSES });
  const r = race([leader, last]);
  leader.position = 190;
  applyBoosts(r, NOW);
  expect(last.bonuses).toBe(MAX_BONUSES);
});

test("-3 words removes the end of the racer's own text", () => {
  const leader = racer({ position: 60 });
  const last = racer({ position: 10 });
  const r = race([leader, last]);
  applyBoosts(r, NOW, only("shortcut"));
  expect(last.boost?.kind).toBe("shortcut");
  expect(racerText(r, last)).toBe(r.text.slice(0, r.text.length - 15));
  expect(leader.cut).toBe(0);
});

test("+3 words lengthens only the leader's text and keeps progress consistent", () => {
  const leader = racer({ position: 60 });
  const last = racer({ position: 10 });
  const r = race([leader, last]);
  const before = racerEnd(r, leader);
  applyBoosts(r, NOW, only("extra"));
  expect(leader.boost?.kind).toBe("extra");
  expect(leader.extra.trim().split(" ")).toHaveLength(3);
  expect(racerEnd(r, leader)).toBe(before + 15);
  expect(racerEnd(r, last)).toBe(r.text.length);
  expect(leader.position).toBe(60);
});

test("fog lands on the leader, bots included, and slows a bot down", () => {
  const [bot] = createBots(["expert"], new Set(), 1);
  bot.position = 600;
  const human = racer({ position: 10 });
  const r = race([bot, human], {}, "abcd ".repeat(400).trim());
  applyBoosts(r, NOW, only("fog"));
  expect(bot.boost?.kind).toBe("fog");
  const [twin] = createBots(["expert"], new Set(), 1);
  twin.position = 600;
  const r2 = race([twin], {}, r.text);
  for (let t = 0; t < 3000; t += 100) {
    stepBot(r, bot, 100, NOW + t);
    stepBot(r2, twin, 100, NOW + t);
  }
  expect(bot.position).toBeLessThan(twin.position);
});

test("-3 words never cuts into the word being typed", () => {
  expect(cutLastWords("one two three four", 18, 2)).toBe(7);
  expect(cutLastWords("one two", 7, 2)).toBeNull();
  const leader = racer({ position: 0 });
  const last = racer({ position: 5 });
  const r = race([leader, last], {}, "one two three four five");
  leader.position = 20;
  applyBoosts(r, NOW, only("shortcut"));
  expect(last.cut).toBe(0);
  expect(last.boost?.kind).not.toBe("shortcut");
});

test("expired badges are cleared", () => {
  const a = racer({ position: 5, boost: { kind: "shortcut", until: NOW - 1 } });
  const b = racer({ position: 5 });
  expect(applyBoosts(race([a, b]), NOW)).toBe(true);
  expect(a.boost).toBeNull();
});
