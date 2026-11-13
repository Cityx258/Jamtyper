"use client";

import { useState } from "react";
import NoteIcon from "@/components/NoteIcon";
import type { Dict } from "@/i18n/en";
import { NOTES, winsFor, type NoteKind } from "@/lib/notes";

type Props = {
  current: NoteKind;
  unlocked: NoteKind[];
  guest: boolean;
  t: Dict["room"]["yourNote"];
  notesT: Dict["profile"]["notes"];
  onPick: (note: NoteKind) => Promise<unknown>;
};

export default function LobbyNotePicker({ current, unlocked, guest, t, notesT, onPick }: Props) {
  const [pending, setPending] = useState(false);
  return (
    <section className="mt-12" aria-labelledby="your-note-title">
      <h2 id="your-note-title" className="font-display text-2xl">
        {t.title}
      </h2>
      <p className="mt-1 max-w-xl text-sm text-muted">{guest ? t.guestHint : t.hint}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {NOTES.map((note) => {
          const open = unlocked.includes(note) && !guest;
          const active = note === current;
          return (
            <button
              key={note}
              type="button"
              aria-pressed={active}
              aria-label={notesT.names[note]}
              title={open || active ? notesT.names[note] : notesT.locked.replace("{n}", String(winsFor(note)))}
              disabled={(!open && !active) || pending}
              onClick={async () => {
                if (active) return;
                setPending(true);
                await onPick(note);
                setPending(false);
              }}
              className={`flex h-16 w-14 flex-col items-center justify-center gap-1 rounded-lg border transition-colors ${
                active
                  ? "border-teal bg-teal/15 text-teal"
                  : open
                    ? "border-line text-ink hover:border-teal"
                    : "cursor-not-allowed border-line text-muted opacity-40"
              }`}
            >
              <NoteIcon note={note} size={28} />
              {!open && !active && (
                <span className="font-mono text-[9px] uppercase tracking-wider">
                  {winsFor(note)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
