import type { NoteKind } from "./notes";

export const STAFF_STEPS = 9;
export const PITCHES = [0, 2, 3, 5, 6, 7] as const;

const FREQUENCIES = [329.63, 349.23, 392, 440, 493.88, 523.25, 587.33, 659.25, 698.46];

const BEATS: Record<NoteKind, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
  thirtySecond: 0.125,
};

export const BEAT_SECONDS = 0.4;
const MIN_SECONDS = 0.14;

export type MelodyNote = { pitch: number; note: NoteKind };
export type ScheduledNote = { freq: number; at: number; length: number };

export const isPitch = (v: unknown): v is number =>
  Number.isInteger(v) && (v as number) >= 0 && (v as number) < STAFF_STEPS;

export const frequency = (pitch: number) => FREQUENCIES[pitch] ?? FREQUENCIES[0];

export const noteSeconds = (note: NoteKind) => Math.max(MIN_SECONDS, BEATS[note] * BEAT_SECONDS);

export function randomPitch(random: () => number = Math.random): number {
  return PITCHES[Math.floor(random() * PITCHES.length)];
}

export function schedule(notes: MelodyNote[]): ScheduledNote[] {
  let at = 0;
  return notes.map(({ pitch, note }) => {
    const length = noteSeconds(note);
    const out = { freq: frequency(pitch), at, length };
    at += length;
    return out;
  });
}

export function melodyOrder<T extends { place: number | null; progress: number }>(racers: T[]): T[] {
  return [...racers].sort(
    (a, b) => (a.place ?? Infinity) - (b.place ?? Infinity) || b.progress - a.progress,
  );
}
