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

export const BEAT_SECONDS = 0.5;

export type MelodyNote = { pitches: number[]; note: NoteKind };
export type ScheduledNote = { freq: number; at: number; length: number };

export const isPitch = (v: unknown): v is number =>
  Number.isInteger(v) && (v as number) >= 0 && (v as number) < STAFF_STEPS;

export const frequency = (pitch: number) => FREQUENCIES[pitch] ?? FREQUENCIES[0];

export const noteSeconds = (note: NoteKind) => BEATS[note] * BEAT_SECONDS;

export const notesPerBeat = (note: NoteKind) => Math.max(1, Math.round(1 / BEATS[note]));

export function randomPitch(random: () => number = Math.random): number {
  return PITCHES[Math.floor(random() * PITCHES.length)];
}

export function randomPitches(note: NoteKind, random: () => number = Math.random): number[] {
  return Array.from({ length: notesPerBeat(note) }, () => randomPitch(random));
}

export function schedule(notes: MelodyNote[]): ScheduledNote[] {
  let at = 0;
  const out: ScheduledNote[] = [];
  for (const { pitches, note } of notes) {
    const length = noteSeconds(note);
    for (const pitch of pitches.slice(0, notesPerBeat(note))) {
      out.push({ freq: frequency(pitch), at, length });
      at += length;
    }
  }
  return out;
}

export function melodyOrder<T extends { place: number | null; progress: number }>(racers: T[]): T[] {
  return [...racers].sort(
    (a, b) => (a.place ?? Infinity) - (b.place ?? Infinity) || b.progress - a.progress,
  );
}
