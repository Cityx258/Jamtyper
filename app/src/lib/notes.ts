export const CLASSIC_NOTES = ["whole", "half", "quarter", "eighth", "sixteenth", "thirtySecond"] as const;
export const SINGERS = ["mikuMini", "mikuGuitar", "rin", "gumi", "teto", "mikuLeek"] as const;
export const NOTES = [...CLASSIC_NOTES, ...SINGERS] as const;
export type NoteKind = (typeof NOTES)[number];
export type ClassicNote = (typeof CLASSIC_NOTES)[number];
export type Singer = (typeof SINGERS)[number];

export const isSinger = (note: NoteKind): note is Singer => (SINGERS as readonly string[]).includes(note);

const SINGER_GLYPHS: Record<Singer, ClassicNote> = {
  mikuMini: "eighth",
  mikuGuitar: "eighth",
  rin: "eighth",
  gumi: "eighth",
  teto: "eighth",
  mikuLeek: "sixteenth",
};

export const glyphFor = (note: NoteKind): ClassicNote => (isSinger(note) ? SINGER_GLYPHS[note] : note);

export const AVATARS: Record<Singer, string> = {
  mikuMini: "/avatars/miku-mini.png",
  mikuGuitar: "/avatars/miku-guitar.png",
  rin: "/avatars/rin.png",
  gumi: "/avatars/gumi.png",
  teto: "/avatars/teto.png",
  mikuLeek: "/avatars/miku-leek.png",
};

export const WINS_PER_NOTE = 5;

// Leek Miku is the trophy for pro typers: she takes far more wins and draws bigger than the rest.
const TROPHY_WINS: Partial<Record<NoteKind, number>> = { mikuLeek: 100 };
const SINGER_SCALE: Partial<Record<Singer, number>> = { mikuLeek: 1.3 };

export const iconSize = (note: NoteKind, size: number) =>
  isSinger(note) ? Math.round(size * (SINGER_SCALE[note] ?? 1)) : size;

export const winningPlaces = (humans: number) => (humans >= 6 ? 3 : humans >= 4 ? 2 : 1);

export const isNote = (v: unknown): v is NoteKind => NOTES.includes(v as NoteKind);

export const winsFor = (note: NoteKind) => TROPHY_WINS[note] ?? NOTES.indexOf(note) * WINS_PER_NOTE;

export const unlockedNotes = (wins: number): NoteKind[] => NOTES.filter((note) => winsFor(note) <= Math.max(0, wins));

export function noteFor(wins: number, chosen: string | null): NoteKind {
  const unlocked = unlockedNotes(wins);
  return isNote(chosen) && unlocked.includes(chosen) ? chosen : unlocked[unlocked.length - 1];
}

export function newlyUnlocked(winsBefore: number, winsAfter: number): NoteKind | null {
  const before = unlockedNotes(winsBefore).length;
  const after = unlockedNotes(winsAfter);
  return after.length > before ? after[after.length - 1] : null;
}
