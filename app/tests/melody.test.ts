import { describe, expect, test } from "bun:test";
import {
  BEAT_SECONDS,
  PHRASE_LENGTH,
  SONGS,
  phrases,
  PITCHES,
  STAFF_STEPS,
  frequency,
  isPitch,
  melodyOrder,
  noteSeconds,
  notesPerBeat,
  randomPitch,
  randomPitches,
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
    expect(noteSeconds("thirtySecond")).toBe(BEAT_SECONDS / 8);
  });

  test("short notes fill a whole beat with random pitches on the scale", () => {
    expect(["whole", "half", "quarter"].map((n) => notesPerBeat(n as "whole"))).toEqual([1, 1, 1]);
    expect(notesPerBeat("eighth")).toBe(2);
    expect(notesPerBeat("sixteenth")).toBe(4);
    expect(notesPerBeat("thirtySecond")).toBe(8);
    const run = randomPitches("thirtySecond");
    expect(run).toHaveLength(8);
    for (const p of run) expect(PITCHES).toContain(p as (typeof PITCHES)[number]);
  });

  test("every player takes at least a beat, one after the other", () => {
    const out = schedule([
      { pitches: [0], note: "half" },
      { pitches: [7, 2], note: "eighth" },
      { pitches: [3, 5, 6, 0], note: "sixteenth" },
      { pitches: [5], note: "quarter" },
    ]);
    const B = BEAT_SECONDS;
    expect(out.map((n) => n.at)).toEqual([0, 2 * B, 2.5 * B, 3 * B, 3.25 * B, 3.5 * B, 3.75 * B, 4 * B]);
    expect(out[2].freq).toBe(frequency(2));
    const end = out[out.length - 1].at + out[out.length - 1].length;
    expect(end).toBe(5 * B);
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

describe("singer phrases", () => {
  test("every song fits on the staff and splits into full phrases", () => {
    for (const song of Object.values(SONGS)) {
      if (!song) continue;
      expect(song.every(isPitch)).toBe(true);
      expect(phrases(song).length).toBeGreaterThan(0);
      expect(phrases(song).every((p) => p.length === PHRASE_LENGTH)).toBe(true);
    }
  });

  test("a singer plays one phrase of their song", () => {
    const pitches = randomPitches("mikuGuitar", () => 0);
    expect(pitches).toEqual(SONGS.mikuGuitar!.slice(0, PHRASE_LENGTH));
    expect(notesPerBeat("mikuGuitar")).toBe(PHRASE_LENGTH);
  });

  test("a singer without a song still plays a full phrase", () => {
    expect(randomPitches("teto")).toHaveLength(PHRASE_LENGTH);
  });
});

