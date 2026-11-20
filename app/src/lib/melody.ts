import { isSinger, type ClassicNote, type NoteKind, type Singer } from "./notes";

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

export type Song = { pitches: number[]; beats: number[] };

export const SONGS: Record<Singer, Song> = {
  mikuMini: {
    pitches: [3, 7, 3, 3, 2, 2, 3, 4, 5, 4, 3, 2, 7, 2, 3, 7, 3, 2, 3, 3, 2, 3, 3, 5],
    beats: [0.5, 1.5, 0.25, 0.25, 0.75, 0.25, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 1.5, 0.5, 0.5, 0.5, 0.5, 0.25, 0.25, 1, 1],
  },
  mikuGuitar: {
    pitches: [5, 5, 4, 5, 4, 5, 7, 6, 5, 4, 5, 4, 5, 4, 3, 4, 5, 5, 4, 5, 2, 7, 6, 5],
    beats: [1.5, 1.5, 0.75, 0.75, 0.5, 0.25, 1.5, 0.75, 0.75, 0.75, 0.75, 0.5, 0.25, 0.75, 0.5, 0.25, 1.5, 1.5, 0.75, 0.75, 0.75, 1.5, 0.75, 0.75],
  },
  rin: {
    pitches: [3, 4, 5, 5, 5, 5, 6, 7, 5, 4, 4, 4, 3, 2, 4, 1, 1, 1, 1, 2, 3, 2, 1, 0, 2, 3, 4, 5, 5, 5, 5, 6],
    beats: [0.25, 0.25, 0.5, 0.5, 0.5, 0.25, 0.25, 1, 1, 0.5, 0.5, 0.5, 0.25, 0.25, 2, 0.5, 0.5, 0.5, 0.25, 0.25, 1, 0.5, 0.5, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.25, 0.25],
  },
  gumi: {
    pitches: [1, 5, 3, 1, 3, 7, 1, 3, 1, 2, 6, 6, 6, 2, 6, 4, 1, 3, 7, 1, 3, 0, 1, 5],
    beats: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 1],
  },
  teto: {
    pitches: [2, 6, 6, 5, 4, 5, 5, 6, 4, 1, 2, 6, 6, 5, 4, 5, 5, 6, 4, 1, 2, 6, 6, 5],
    beats: [0.5, 0.5, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.5, 0.5, 0.5, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.5, 0.5, 0.5, 0.5, 0.25],
  },
  mikuLeek: {
    pitches: [2, 5, 4, 3, 5, 6, 1, 5, 3, 1, 4, 3, 3, 4, 6, 3, 5, 3, 1, 7, 5, 3, 1, 4, 5, 4, 1, 4, 7, 5, 5, 2, 5, 4, 5, 2, 5, 3, 5, 6, 4, 6, 8, 7, 6, 5, 2, 0, 2, 5, 3, 1, 5, 3, 1, 6],
    beats: [1, 0.5, 0.5, 0.5, 0.5, 1, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25],
  },
};

export type Phrase = Song;

export function phrases(song: Song): Phrase[] {
  const out: Phrase[] = [];
  for (let i = 0; i + PHRASE_LENGTH <= song.pitches.length; i += PHRASE_LENGTH) {
    out.push({ pitches: song.pitches.slice(i, i + PHRASE_LENGTH), beats: song.beats.slice(i, i + PHRASE_LENGTH) });
  }
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
  if (isSinger(note)) {
    const options = phrases(SONGS[note]);
    return options[Math.floor(random() * options.length)].pitches;
  }
  return Array.from({ length: notesPerBeat(note) }, () => randomPitch(random));
}

const same = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i]);

export function noteLengths(note: NoteKind, pitches: number[]): number[] {
  const played = pitches.slice(0, notesPerBeat(note));
  if (isSinger(note)) {
    const phrase = phrases(SONGS[note]).find((p) => same(p.pitches, played));
    if (phrase) return phrase.beats.map((b) => b * BEAT_SECONDS);
  }
  return played.map(() => noteSeconds(note));
}

const WRITTEN: [number, ClassicNote, boolean][] = [
  [4, "whole", false],
  [3, "half", true],
  [2, "half", false],
  [1.5, "quarter", true],
  [1, "quarter", false],
  [0.75, "eighth", true],
  [0.5, "eighth", false],
  [0.375, "sixteenth", true],
  [0.25, "sixteenth", false],
  [0.1875, "thirtySecond", true],
  [0.125, "thirtySecond", false],
];

export function written(beats: number): { note: ClassicNote; dotted: boolean } {
  const [, note, dotted] = WRITTEN.find(([b]) => b <= beats + 1e-9) ?? WRITTEN[WRITTEN.length - 1];
  return { note, dotted };
}

export function spell(beats: number): { note: ClassicNote; dotted: boolean; beats: number }[] {
  const out: { note: ClassicNote; dotted: boolean; beats: number }[] = [];
  let left = beats;
  while (left > 1e-9) {
    const [value, note, dotted] = WRITTEN.find(([b]) => b <= left + 1e-9) ?? WRITTEN[WRITTEN.length - 1];
    out.push({ note, dotted, beats: value });
    left -= value;
  }
  return out;
}

export function schedule(notes: MelodyNote[]): ScheduledNote[] {
  let at = 0;
  const out: ScheduledNote[] = [];
  for (const { pitches, note } of notes) {
    const lengths = noteLengths(note, pitches);
    pitches.slice(0, lengths.length).forEach((pitch, i) => {
      out.push({ freq: frequency(pitch), at, length: lengths[i] });
      at += lengths[i];
    });
  }
  return out;
}

export function melodyOrder<T extends { place: number | null; progress: number }>(racers: T[]): T[] {
  return [...racers].sort(
    (a, b) => (a.place ?? Infinity) - (b.place ?? Infinity) || b.progress - a.progress,
  );
}
