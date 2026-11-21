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

export const BAR_BEATS = 4;
export const PHRASE_BARS = 2;
export const MAX_PHRASE_NOTES = 128;

export type Accidental = -1 | 0 | 1;

export type Song = { title: string; pitches: number[]; beats: number[]; accidentals?: Accidental[]; bars?: number };

export const SONGS: Record<Singer, Song> = {
  mikuMini: {
    title: "World is Mine (ryo, supercell)",
    pitches: [3, 7, 3, 3, 2, 2, 3, 4, 5, 4, 3, 2, 7, 2, 3, 7, 3, 2, 3, 3, 2, 3, 3, 5],
    beats: [0.5, 1.5, 0.25, 0.25, 0.75, 0.25, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 1.5, 0.5, 0.5, 0.5, 0.5, 0.25, 0.25, 1, 1],
  },
  mikuGuitar: {
    title: "Rolling Girl (wowaka)",
    pitches: [5, 5, 4, 5, 4, 5, 7, 6, 5, 4, 5, 4, 5, 4, 3, 4, 5, 5, 4, 5, 2, 7, 6, 5],
    beats: [1.5, 1.5, 0.75, 0.75, 0.5, 0.25, 1.5, 0.75, 0.75, 0.75, 0.75, 0.5, 0.25, 0.75, 0.5, 0.25, 1.5, 1.5, 0.75, 0.75, 0.75, 1.5, 0.75, 0.75],
  },
  rin: {
    title: "Daughter of Evil (mothy)",
    pitches: [3, 4, 5, 5, 5, 5, 6, 7, 5, 4, 4, 4, 3, 2, 4, 1, 1, 1, 1, 2, 3, 2, 1, 0, 2, 3, 4, 5, 5, 5, 5, 6],
    beats: [0.25, 0.25, 0.5, 0.5, 0.5, 0.25, 0.25, 1, 1, 0.5, 0.5, 0.5, 0.25, 0.25, 2, 0.5, 0.5, 0.5, 0.25, 0.25, 1, 0.5, 0.5, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.25, 0.25],
  },
  gumi: {
    title: "ECHO (Crusher-P)",
    pitches: [1, 5, 3, 1, 3, 7, 1, 3, 1, 2, 6, 6, 6, 2, 6, 4, 1, 3, 7, 1, 3, 0, 1, 5],
    beats: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 1],
  },
  teto: {
    title: "Tetoris (Hiiragi Magnetite)",
    pitches: [2, 6, 6, 5, 4, 5, 5, 6, 4, 1, 2, 6, 6, 5, 4, 5, 5, 6, 4, 1, 2, 6, 6, 5],
    beats: [0.5, 0.5, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.5, 0.5, 0.5, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.5, 0.5, 0.5, 0.5, 0.25],
  },
  mikuLeek: {
    title: "The Intense Voice of Hatsune Miku (cosMo), the fast part",
    bars: 4,
    pitches: [2, 5, 4, 3, 5, 6, 1, 5, 3, 1, 4, 3, 3, 4, 6, 3, 5, 3, 1, 7, 5, 3, 1, 4, 5, 4, 1, 4, 7, 5, 5, 2, 5, 4, 5, 2, 5, 3, 5, 6, 4, 6, 8, 7, 6, 5, 2, 0, 2, 5, 3, 1, 5, 3, 1, 6],
    beats: [1, 0.5, 0.5, 0.5, 0.5, 1, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25],
  },
};

export type Phrase = { pitches: number[]; beats: number[]; accidentals: Accidental[] };

export const phraseBeats = (song: Song) => (song.bars ?? PHRASE_BARS) * BAR_BEATS;

const EPS = 1e-9;

function fit(beats: number[], limit: number): number[] {
  const out: number[] = [];
  let total = 0;
  for (const b of beats) {
    if (total >= limit - EPS) break;
    out.push(Math.min(b, limit - total));
    total += b;
  }
  return out;
}

function from(song: Song, start: number, count: number): Phrase {
  const n = song.pitches.length;
  const at = (k: number) => (start + k) % n;
  return {
    pitches: Array.from({ length: count }, (_, k) => song.pitches[at(k)]),
    beats: Array.from({ length: count }, (_, k) => song.beats[at(k)]),
    accidentals: Array.from({ length: count }, (_, k) => song.accidentals?.[at(k)] ?? 0),
  };
}

function phraseFrom(song: Song, start: number): Phrase {
  let count = 0;
  let total = 0;
  const limit = phraseBeats(song);
  while (total < limit - EPS) total += song.beats[(start + count++) % song.beats.length];
  const run = from(song, start, count);
  return { ...run, beats: fit(run.beats, limit) };
}

export function phrases(song: Song): Phrase[] {
  if (song.pitches.length === 0) return [];
  const out: Phrase[] = [];
  let position = 0;
  song.beats.forEach((b, i) => {
    if (Math.abs(position / BAR_BEATS - Math.round(position / BAR_BEATS)) < EPS) out.push(phraseFrom(song, i));
    position += b;
  });
  return out;
}

function matching(song: Song, pitches: number[]): Phrase | null {
  const n = song.pitches.length;
  if (pitches.length === 0 || n === 0) return null;
  const phrase = phrases(song).find((p) => p.pitches.length === pitches.length && p.pitches.every((v, k) => v === pitches[k]));
  if (phrase) return phrase;
  for (let start = 0; start < n; start++) {
    if (!pitches.every((p, k) => song.pitches[(start + k) % n] === p)) continue;
    const run = from(song, start, pitches.length);
    return { ...run, beats: fit(run.beats, phraseBeats(song)) };
  }
  return null;
}

export const BEAT_SECONDS = 0.5;

export type MelodyNote = { pitches: number[]; note: NoteKind };
export type ScheduledNote = { freq: number; at: number; length: number };

export const isPitch = (v: unknown): v is number =>
  Number.isInteger(v) && (v as number) >= 0 && (v as number) < STAFF_STEPS;

export const frequency = (pitch: number, accidental: Accidental = 0) =>
  (FREQUENCIES[pitch] ?? FREQUENCIES[0]) * 2 ** (accidental / 12);

export function noteAccidentals(note: NoteKind, pitches: number[]): Accidental[] {
  const played = pitches.slice(0, notesPerBeat(note));
  const phrase = isSinger(note) ? matching(SONGS[note], played) : null;
  return played.map((_, i) => phrase?.accidentals[i] ?? 0);
}

export const noteSeconds = (note: NoteKind) => BEATS[note] * BEAT_SECONDS;

export const notesPerBeat = (note: NoteKind) =>
  isSinger(note) ? MAX_PHRASE_NOTES : Math.max(1, Math.round(1 / BEATS[note]));

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

export function noteLengths(note: NoteKind, pitches: number[]): number[] {
  const played = pitches.slice(0, notesPerBeat(note));
  if (isSinger(note)) {
    const phrase = matching(SONGS[note], played);
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
    const accidentals = noteAccidentals(note, pitches);
    pitches.slice(0, lengths.length).forEach((pitch, i) => {
      out.push({ freq: frequency(pitch, accidentals[i]), at, length: lengths[i] });
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
