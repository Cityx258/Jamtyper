import { describe, expect, test } from "bun:test";
import { dailyAverages, localDay, timeTicks } from "../src/lib/progress-graph";

const at = (iso: string) => new Date(iso).getTime();
const utcDay = (t: number) => localDay(t, "UTC");

describe("progress graph", () => {
  test("local day follows the time zone", () => {
    const t = at("2026-11-12T03:00:00Z");
    expect(localDay(t, "UTC")).toBe("2026-11-12");
    expect(localDay(t, "America/Toronto")).toBe("2026-11-11");
  });

  test("averages the races of each day, in time order", () => {
    const days = dailyAverages(
      [
        { at: at("2026-11-11T20:00:00Z"), wpm: 60 },
        { at: at("2026-11-10T10:00:00Z"), wpm: 40 },
        { at: at("2026-11-11T10:00:00Z"), wpm: 80 },
      ],
      utcDay,
    );
    expect(days.map((d) => [d.day, d.wpm, d.races])).toEqual([
      ["2026-11-10", 40, 1],
      ["2026-11-11", 70, 2],
    ]);
    expect(days[1].at).toBe(at("2026-11-11T15:00:00Z"));
  });

  test("no races gives no days", () => {
    expect(dailyAverages([], utcDay)).toEqual([]);
  });

  test("ticks span the range evenly", () => {
    expect(timeTicks(0, 300, 4)).toEqual([0, 100, 200, 300]);
    expect(timeTicks(5, 5, 4)).toEqual([5]);
  });
});
