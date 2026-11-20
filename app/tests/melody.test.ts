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
  noteLengths,
  notesPerBeat,
  phraseBeats,
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
  test("every song fits on the staff and splits into full phrases with a length per note", () => {
    for (const song of Object.values(SONGS)) {
      expect(song.pitches.every(isPitch)).toBe(true);
      expect(song.beats).toHaveLength(song.pitches.length);
      expect(song.beats.every((b) => b > 0 && Number.isInteger(b * 4))).toBe(true);
      expect(phrases(song).length).toBeGreaterThan(0);
      expect(phrases(song).every((p) => p.pitches.length === PHRASE_LENGTH && p.beats.length === PHRASE_LENGTH)).toBe(true);
    }
  });

  test("a singer plays one phrase of their song", () => {
    const pitches = randomPitches("mikuGuitar", () => 0);
    expect(pitches).toEqual(SONGS.mikuGuitar.pitches.slice(0, PHRASE_LENGTH));
    expect(notesPerBeat("mikuGuitar")).toBe(PHRASE_LENGTH);
  });

  test("teto sings her song too", () => {
    expect(randomPitches("teto", () => 0)).toEqual(SONGS.teto.pitches.slice(0, PHRASE_LENGTH));
  });

  test("a singer's phrase keeps the rhythm of the song", () => {
    const phrase = phrases(SONGS.mikuMini)[0];
    const lengths = noteLengths("mikuMini", phrase.pitches);
    expect(lengths).toEqual(phrase.beats.map((b) => b * BEAT_SECONDS));
    expect(new Set(lengths).size).toBeGreaterThan(1);
    const out = schedule([
      { pitches: [0], note: "quarter" },
      { pitches: phrase.pitches, note: "mikuMini" },
    ]);
    let at = BEAT_SECONDS;
    phrase.beats.forEach((b, i) => {
      expect(out[i + 1].at).toBeCloseTo(at, 9);
      expect(out[i + 1].length).toBeCloseTo(b * BEAT_SECONDS, 9);
      at += b * BEAT_SECONDS;
    });
  });

  test("a phrase takes whole beats in the bar count", () => {
    const phrase = phrases(SONGS.mikuMini)[0];
    const total = phrase.beats.reduce((a, b) => a + b, 0);
    expect(phraseBeats("mikuMini", phrase.pitches)).toBe(Math.ceil(total));
    expect(phraseBeats("quarter", [3])).toBe(1);
    expect(phraseBeats("sixteenth", [1, 2, 3, 4])).toBe(1);
  });

  test("unknown pitches for a singer fall back to an even rhythm", () => {
    const lengths = noteLengths("rin", [0, 0, 0, 0, 0, 0, 0, 0]);
    expect(lengths).toEqual(Array(8).fill(noteSeconds("rin")));
  });
});
