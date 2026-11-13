import { expect, test } from "bun:test";
import { layout } from "../src/components/RaceMelody";
import type { RacerView } from "../src/lib/room-protocol";

const racer = (id: string, note: RacerView["note"], pitches: number[]): RacerView => ({
  id,
  name: id,
  progress: 10,
  errors: 0,
  isBot: false,
  team: null,
  note,
  pitches,
  unlocked: null,
  samples: null,
  wpm: 50,
  accuracy: 1,
  outcome: "finished",
  place: 1,
  timeMs: null,
  missed: {},
  jump: 0,
  boost: null,
});

const racers = [
  racer("a", "thirtySecond", [0, 2, 3, 5, 6, 7, 0, 2]),
  racer("b", "whole", [3]),
  racer("c", "eighth", [5, 6]),
];

test("a wide screen fits the whole melody on one staff", () => {
  const { systems, times } = layout(racers, 1000);
  expect(systems).toHaveLength(1);
  expect(times).toHaveLength(11);
});

test("a narrow screen wraps onto more staves without losing notes", () => {
  const { systems, times } = layout(racers, 240);
  expect(systems.length).toBeGreaterThan(1);
  const symbols = systems.flatMap((s) => s.symbols);
  expect(symbols.map((s) => s.index)).toEqual([...Array(11).keys()]);
  for (const s of symbols) expect(s.x).toBeLessThanOrEqual(240);
  expect(times).toEqual([...times].sort((a, b) => a - b));
});
