"use client";

import { useEffect, useRef, useState } from "react";
import NoteIcon from "@/components/NoteIcon";
import { secondaryButton } from "@/components/ui";
import type { Dict } from "@/i18n/en";
import { melodyOrder, notesPerBeat, noteSeconds, type MelodyNote } from "@/lib/melody";
import type { NoteKind } from "@/lib/notes";
import type { RacerView } from "@/lib/room-protocol";
import { playMelody, soundOn } from "@/lib/sound";

type Props = {
  racers: RacerView[];
  you: string | null;
  raceKey: number;
  t: Dict["room"]["melody"];
};

const GAP = 9;
const TOP = 26;
const STAFF = GAP * 4;
const HEIGHT = TOP + STAFF + 34;
const CLEF = 40;
const SLOT = 28;
const BAR = 16;
const SIZE = 34;
const EXTRA: Record<NoteKind, number> = {
  whole: 40,
  half: 20,
  quarter: 6,
  eighth: 0,
  sixteenth: 0,
  thirtySecond: 0,
};

const heard = new Set<number>();

type Symbol = { x: number; pitch: number; note: NoteKind; racer: number; index: number };
type Group = { racer: number; from: number; to: number };
type System = { symbols: Symbol[]; bars: number[]; groups: Group[] };

const START = CLEF + 14;
const END = 16;

export function layout(racers: RacerView[], width: number) {
  const systems: System[] = [];
  const times: number[] = [];
  let system: System = { symbols: [], bars: [], groups: [] };
  let x = START;
  let beats = 0;
  let at = 0;
  const newSystem = () => {
    systems.push(system);
    system = { symbols: [], bars: [], groups: [] };
    x = START;
  };
  racers.forEach((r, i) => {
    const step = SLOT + EXTRA[r.note];
    const pitches = r.pitches.slice(0, notesPerBeat(r.note));
    if (beats > 0 && beats % 4 === 0 && x > START) {
      system.bars.push(x - 4);
      x += BAR - 8;
    }
    if (x > START && x + Math.min(pitches.length * step, width - START - END) > width - END) newSystem();
    let group: Group = { racer: i, from: x, to: x };
    pitches.forEach((pitch) => {
      if (x > START && x + SLOT > width - END) {
        system.groups.push(group);
        newSystem();
        group = { racer: i, from: x, to: x };
      }
      system.symbols.push({ x, pitch, note: r.note, racer: i, index: times.length });
      times.push(at);
      group.to = x;
      x += step;
      at += noteSeconds(r.note);
    });
    system.groups.push(group);
    beats += Math.max(1, notesPerBeat(r.note) * (noteSeconds(r.note) / noteSeconds("quarter")));
  });
  if (system.symbols.length) systems.push(system);
  return { systems, times };
}

export default function RaceMelody({ racers, you, raceKey, t }: Props) {
  const ordered = melodyOrder(racers);
  const [width, setWidth] = useState(640);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const { systems, times } = layout(ordered, width);
  const [active, setActive] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function stop() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function start(force: boolean) {
    stop();
    const notes: MelodyNote[] = ordered.map((r) => ({ pitches: r.pitches, note: r.note }));
    const total = playMelody(notes, force);
    if (!total) return;
    times.forEach((at, i) => {
      timers.current.push(setTimeout(() => setActive(i), (at + 0.05) * 1000));
    });
    timers.current.push(setTimeout(() => setActive(null), (total + 0.3) * 1000));
  }

  const startRef = useRef(start);
  useEffect(() => {
    startRef.current = start;
  });
  useEffect(() => {
    if (heard.has(raceKey) || !soundOn()) return;
    heard.add(raceKey);
    const id = setTimeout(() => startRef.current(false), 600);
    return () => clearTimeout(id);
  }, [raceKey]);
  useEffect(() => stop, []);

  const y = (pitch: number) => TOP + STAFF - (pitch * GAP) / 2;

  return (
    <section className="mt-12" aria-labelledby="melody-title">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="melody-title" className="font-display text-2xl">
          {t.title}
        </h2>
        <button
          type="button"
          onClick={() => start(true)}
          disabled={active !== null}
          className={secondaryButton}
        >
          {active !== null ? t.playing : t.play}
        </button>
      </div>
      <p className="mt-2 max-w-xl text-sm text-muted">{t.hint}</p>
      <div ref={box} className="mt-4 space-y-1">
        {systems.map((system, n) => {
          const last = n === systems.length - 1;
          const right = last ? (system.symbols.at(-1)?.x ?? START) + SLOT + 4 : width;
          return (
            <div key={n} className="relative" style={{ width: right, maxWidth: "100%", height: HEIGHT }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="absolute inset-x-0 h-px bg-muted/55"
                  style={{ top: TOP + i * GAP }}
                />
              ))}
              <svg aria-hidden className="absolute left-0 top-0 overflow-visible" width={CLEF} height={HEIGHT}>
                <text x={2} y={TOP + STAFF} className="select-none fill-muted font-music" style={{ fontSize: GAP * 4.3 }}>
                  {"\u{1D11E}"}
                </text>
              </svg>
              {system.bars.map((x) => (
                <span key={x} className="absolute w-px bg-muted/55" style={{ left: x, top: TOP, height: STAFF }} />
              ))}
              {last ? (
                <>
                  <span className="absolute right-[3px] w-px bg-muted/60" style={{ top: TOP, height: STAFF }} />
                  <span className="absolute right-0 w-[2px] bg-muted/80" style={{ top: TOP, height: STAFF }} />
                </>
              ) : (
                <span className="absolute right-0 w-px bg-muted/55" style={{ top: TOP, height: STAFF }} />
              )}
              {system.symbols.map((s) => {
                const headX = (s.note === "whole" ? 14 : 9) * ((SIZE * 0.7) / 28);
                const headY = ((s.note === "whole" ? 27 : 33) * SIZE) / 40;
                const racer = ordered[s.racer];
                return (
                  <span
                    key={s.index}
                    aria-hidden
                    className={`absolute transition-transform duration-100 ${
                      active === s.index
                        ? "scale-125 text-teal-bright"
                        : racer.id === you
                          ? "text-teal"
                          : "text-ink"
                    }`}
                    style={{ left: s.x - headX, top: y(s.pitch) - headY }}
                  >
                    <NoteIcon note={s.note} size={SIZE} />
                  </span>
                );
              })}
              {system.groups.map((g) => {
                const racer = ordered[g.racer];
                return (
                  <span
                    key={racer.id}
                    title={racer.name}
                    className={`absolute text-center font-mono text-[11px] ${
                      racer.id === you ? "text-teal" : "text-muted"
                    }`}
                    style={{ left: g.from - 14, width: g.to - g.from + 28, top: TOP + STAFF + 14 }}
                  >
                    {racer.place ?? "–"}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
      <ol className="sr-only">
        {ordered.map((r) => (
          <li key={r.id}>{r.name}</li>
        ))}
      </ol>
    </section>
  );
}
