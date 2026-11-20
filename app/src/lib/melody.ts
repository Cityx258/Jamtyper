import { isSinger, type NoteKind, type Singer } from "./notes";

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
  mikuMini: 0.5,
  mikuGuitar: 0.5,
  rin: 0.5,
  gumi: 0.5,
  teto: 0.5,
  mikuLeek: 0.25,
};

export const PHRASE_LENGTH = 8;

export const SONGS: Record<Singer, number[] | null> = {
  mikuMini: [3, 7, 3, 3, 2, 2, 3, 4, 5, 4, 3, 2, 7, 2, 3, 7, 3, 2, 3, 3, 2, 3, 3, 5],
  mikuGuitar: [5, 5, 4, 5, 4, 5, 7, 6, 5, 4, 5, 4, 5, 4, 3, 4, 5, 5, 4, 5, 2, 7, 6, 5],
  rin: [3, 4, 5, 5, 5, 5, 6, 7, 5, 4, 4, 4, 3, 2, 4, 1, 1, 1, 1, 2, 3, 2, 1, 0, 2, 3, 4, 5, 5, 5, 5, 6],
  gumi: [3, 7, 5, 3, 5, 2, 3, 5, 2, 3, 7, 7, 7, 3, 7, 5, 3, 5, 2, 3, 5, 2, 3, 7],
  teto: null,
  mikuLeek: [
    2, 5, 4, 3, 5, 6, 1, 5, 3, 1, 4, 3, 3, 4, 6, 3, 5, 3, 1, 7, 5, 3, 1, 4, 5, 4, 1, 4, 7, 5, 5, 2, 5, 4, 5, 2,
    5, 3, 5, 6, 4, 6, 8, 7, 6, 5, 2, 0, 2, 5, 3, 1, 5, 3, 1, 6,
  ],
};

export function phrases(song: number[]): number[][] {
  const out: number[][] = [];
  for (let i = 0; i + PHRASE_LENGTH <= song.length; i += PHRASE_LENGTH) out.push(song.slice(i, i + PHRASE_LENGTH));
  return out;
}

export const BEAT_SECONDS = 0.5;

export type MelodyNote = { pitches: number[]; note: NoteKind };
export type ScheduledNote = { freq: number; at: number; length: number };

export const isPitch = (v: unknown): v is number =>
  Number.isInteger(v) && (v as number) >= 0 && (v as number) < STAFF_STEPS;

export const frequency = (pitch: number) => FREQUENCIES[pitch] ?? FREQUENCIES[0];

export const noteSeconds = (note: NoteKind) => BEATS[note] * BEAT_SECONDS;

export const notesPerBeat = (note: NoteKind) =>
  isSinger(note) ? PHRASE_LENGTH : Math.max(1, Math.round(1 / BEATS[note]));

export function randomPitch(random: () => number = Math.random): number {
  return PITCHES[Math.floor(random() * PITCHES.length)];
}

export function randomPitches(note: NoteKind, random: () => number = Math.random): number[] {
  const song = isSinger(note) ? SONGS[note] : null;
  if (song) {
    const options = phrases(song);
    return options[Math.floor(random() * options.length)];
  }
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
