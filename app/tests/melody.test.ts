import { describe, expect, test } from "bun:test";
import {
  BEAT_SECONDS,
  PITCHES,
  STAFF_STEPS,
  frequency,
  isPitch,
  melodyOrder,
  noteSeconds,
  randomPitch,
  schedule,
} from "../src/lib/melody";

describe("melody", () => {
  test("random pitches stay on the pentatonic steps of the staff", () => {
    for (let i = 0; i < 200; i++) expect(PITCHES).toContain(randomPitch() as (typeof PITCHES)[number]);
    expect(randomPitch(() => 0)).toBe(PITCHES[0]);
    expect(randomPitch(() => 0.999)).toBe(PITCHES[PITCHES.length - 1]);
  });

  test("pitches go up the staff", () => {
    for (let p = 1; p < STAFF_STEPS; p++) expect(frequency(p)).toBeGreaterThan(frequency(p - 1));
    expect(isPitch(4)).toBe(true);
    expect(isPitch(9)).toBe(false);
    expect(isPitch(1.5)).toBe(false);
  });

  test("a note lasts as long as its kind", () => {
    expect(noteSeconds("whole")).toBe(4 * BEAT_SECONDS);
    expect(noteSeconds("quarter")).toBe(BEAT_SECONDS);
    expect(noteSeconds("thirtySecond")).toBeGreaterThan(0.1);
  });

  test("notes are played one after the other", () => {
    const out = schedule([
      { pitch: 0, note: "half" },
      { pitch: 7, note: "quarter" },
      { pitch: 3, note: "quarter" },
    ]);
    expect(out.map((n) => n.at)).toEqual([0, 2 * BEAT_SECONDS, 3 * BEAT_SECONDS]);
    expect(out[1].freq).toBe(frequency(7));
  });

  test("the melody follows the finishing order, then progress", () => {
    const order = melodyOrder([
      { id: "c", place: null, progress: 10 },
      { id: "b", place: 2, progress: 50 },
      { id: "d", place: null, progress: 30 },
      { id: "a", place: 1, progress: 50 },
    ]);
    expect(order.map((r) => r.id)).toEqual(["a", "b", "d", "c"]);
  });
});
