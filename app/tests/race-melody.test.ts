import { expect, test } from "bun:test";
import { beams, layout, ties } from "../src/components/RaceMelody";
import { phrases, SONGS } from "../src/lib/melody";
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
  end: 100,
  extra: "",
  bonuses: 0,
  rawWpm: 0,
  mistakes: 0,
  record: false,
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
  expect([...new Set(symbols.map((s) => s.index))]).toEqual([...Array(11).keys()]);
  for (const s of symbols) expect(s.x).toBeLessThanOrEqual(240);
  expect(times).toEqual([...times].sort((a, b) => a - b));
});

test("a singer's phrase is written in the rhythm it plays", () => {
  const phrase = [3, 7, 3, 3, 2, 2, 3, 4];
  const { systems, times } = layout([racer("m", "mikuMini", phrase)], 1000);
  const symbols = systems[0].symbols;
  expect(symbols.map((s) => s.pitch)).toEqual(phrase);
  expect(symbols.map((s) => s.note)).toEqual([
    "eighth",
    "quarter",
    "sixteenth",
    "sixteenth",
    "eighth",
    "sixteenth",
    "eighth",
    "eighth",
  ]);
  expect(symbols.map((s) => s.dotted)).toEqual([false, true, false, false, true, false, false, false]);
  expect(times.map((t) => t / 0.5)).toEqual([0, 0.5, 2, 2.25, 2.5, 3.25, 3.5, 4]);
  const joined = beams(systems[0]);
  expect(joined.map((b) => b.notes.map((s) => s.index))).toEqual([
    [2, 3, 4],
    [5, 6],
  ]);
  expect(joined[0].segments.map((g) => g.level)).toEqual([0, 1]);
  expect(joined[1].segments.map((g) => g.level)).toEqual([0, 1]);
});

test("a note that crosses a bar line is split at the bar and tied", () => {
  const { systems } = layout(
    [racer("q", "quarter", [0]), racer("m", "mikuMini", [3, 7, 3, 3, 2, 2, 3, 4])],
    1000,
  );
  const [bar] = systems[0].bars;
  const symbols = systems[0].symbols;
  const after = symbols.find((s) => s.x > bar)!;
  const before = symbols[symbols.indexOf(after) - 1];
  expect(after.index).toBe(5);
  expect(before.index).toBe(5);
  expect(before.tie).toBe(true);
  expect(after.tied).toBe(true);
  expect([before.note, before.dotted, after.note, after.dotted]).toEqual(["eighth", false, "sixteenth", false]);
  expect(ties(systems[0])).toHaveLength(1);
});

test("a long classic note landing mid-measure is tied across the bar too", () => {
  const { systems, times } = layout(
    [racer("m", "mikuMini", [3, 7, 3, 3, 2, 2, 3, 4]), racer("w", "whole", [3])],
    1000,
  );
  expect(times).toHaveLength(9);
  const whole = systems[0].symbols.filter((s) => s.racer === 1);
  expect(whole.map((s) => [s.note, s.dotted])).toEqual([
    ["half", true],
    ["eighth", false],
    ["eighth", false],
  ]);
  expect(whole.map((s) => s.tie)).toEqual([true, true, false]);
  expect(systems[0].bars).toHaveLength(2);
});

test("every bar holds exactly four beats", () => {
  const all = [
    racer("a", "mikuMini", [3, 7, 3, 3, 2, 2, 3, 4]),
    racer("b", "half", [2]),
    racer("c", "mikuGuitar", phrases(SONGS.mikuGuitar)[0].pitches),
    racer("d", "whole", [5]),
  ];
  const { systems } = layout(all, 5000);
  const beats: Record<string, number> = {
    whole: 4, half: 2, quarter: 1, eighth: 0.5, sixteenth: 0.25, thirtySecond: 0.125,
  };
  const symbols = systems[0].symbols;
  const bars = systems[0].bars;
  const measures = bars.map((bar, n) =>
    symbols
      .filter((s) => s.x > (bars[n - 1] ?? 0) && s.x < bar)
      .reduce((sum, s) => sum + beats[s.note] * (s.dotted ? 1.5 : 1), 0),
  );
  expect(measures.length).toBeGreaterThan(2);
  for (const m of measures) expect(m).toBeCloseTo(4, 9);
});

test("Leek Miku's fast phrase is drawn as sixteenth notes", () => {
  const { systems } = layout([racer("l", "mikuLeek", phrases(SONGS.mikuLeek)[2].pitches)], 1000);
  expect(systems[0].symbols.every((s) => s.note === "sixteenth" || s.note === "eighth")).toBe(true);
  expect(Math.max(...beams(systems[0]).flatMap((b) => b.segments.map((g) => g.level)))).toBe(1);
});

test("classic notes keep one beam group per racer", () => {
  const { systems } = layout(racers, 1000);
  expect(beams(systems[0]).map((b) => b.notes.length)).toEqual([8, 2]);
});
