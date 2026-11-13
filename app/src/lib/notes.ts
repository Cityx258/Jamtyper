export const NOTES = ["whole", "half", "quarter", "eighth", "sixteenth", "thirtySecond"] as const;
export type NoteKind = (typeof NOTES)[number];

export const WINS_PER_NOTE = 5;

export const isNote = (v: unknown): v is NoteKind => NOTES.includes(v as NoteKind);

export const winsFor = (note: NoteKind) => NOTES.indexOf(note) * WINS_PER_NOTE;

export function unlockedNotes(wins: number): NoteKind[] {
  const count = Math.min(NOTES.length, 1 + Math.floor(Math.max(0, wins) / WINS_PER_NOTE));
  return NOTES.slice(0, count);
}

export function noteFor(wins: number, chosen: string | null): NoteKind {
  const unlocked = unlockedNotes(wins);
  return isNote(chosen) && unlocked.includes(chosen) ? chosen : unlocked[unlocked.length - 1];
}

export function newlyUnlocked(winsBefore: number, winsAfter: number): NoteKind | null {
  const before = unlockedNotes(winsBefore).length;
  const after = unlockedNotes(winsAfter);
  return after.length > before ? after[after.length - 1] : null;
}
