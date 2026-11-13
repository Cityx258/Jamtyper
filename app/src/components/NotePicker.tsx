"use client";

import { useState } from "react";
import { pickNote } from "@/app/note-actions";
import NoteIcon from "@/components/NoteIcon";
import type { Dict } from "@/i18n/en";
import { NOTES, unlockedNotes, winsFor, type NoteKind } from "@/lib/notes";

type Props = {
  wins: number;
  current: NoteKind;
  t: Dict["profile"]["notes"];
};

export default function NotePicker({ wins, current, t }: Props) {
  const [selected, setSelected] = useState(current);
  const [pending, setPending] = useState<NoteKind | null>(null);
  const unlocked = unlockedNotes(wins);
  const next = NOTES.find((n) => !unlocked.includes(n));

  async function choose(note: NoteKind) {
    if (note === selected) return;
    setPending(note);
    if (await pickNote(note).catch(() => false)) setSelected(note);
    setPending(null);
  }

  return (
    <section className="mt-16" aria-labelledby="notes-title">
      <h2 id="notes-title" className="font-display text-3xl">
        {t.title}
      </h2>
      <p className="mt-2 max-w-xl text-muted">
        {next
          ? t.progress
              .replace("{n}", String(winsFor(next) - wins))
              .replace("{note}", t.names[next].toLowerCase())
          : t.allUnlocked}
      </p>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {NOTES.map((note) => {
          const open = unlocked.includes(note);
          const active = note === selected;
          return (
            <li key={note}>
              <button
                type="button"
                disabled={!open || pending !== null}
                aria-pressed={active}
                onClick={() => choose(note)}
                className={`flex h-full w-full flex-col items-center gap-3 rounded-lg border px-3 py-5 text-center transition-colors ${
                  active
                    ? "border-teal bg-teal/15 text-ink"
                    : open
                      ? "border-line text-ink hover:border-teal"
                      : "cursor-not-allowed border-line text-muted opacity-50"
                }`}
              >
                <NoteIcon note={note} size={44} className={open ? "text-teal" : ""} />
                <span className="text-sm font-medium">{t.names[note]}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  {active ? t.selected : open ? t.choose : t.locked.replace("{n}", String(winsFor(note)))}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
