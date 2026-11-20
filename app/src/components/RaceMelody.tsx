"use client";

import { useEffect, useRef, useState } from "react";
import NoteIcon from "@/components/NoteIcon";
import { secondaryButton } from "@/components/ui";
import type { Dict } from "@/i18n/en";
import { BEAT_SECONDS, melodyOrder, noteLengths, notesPerBeat, spell, type MelodyNote } from "@/lib/melody";
import { NOTES, type ClassicNote } from "@/lib/notes";
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
const EXTRA: Record<ClassicNote, number> = {
  whole: 40,
  half: 20,
  quarter: 6,
  eighth: 0,
  sixteenth: 0,
  thirtySecond: 0,
};
const DOT = 7;

const heard = new Set<number>();

type Symbol = {
  id: number;
  x: number;
  pitch: number;
  note: ClassicNote;
  dotted: boolean;
  racer: number;
  beat: number;
  index: number;
  tie: boolean;
  tied: boolean;
};
type Group = { racer: number; from: number; to: number };
type System = { symbols: Symbol[]; bars: number[]; groups: Group[] };

const START = CLEF + 14;
const END = 16;
const SCALE = SIZE / 40;
const STEM_X = 5.2 * SCALE;
const STEM_W = 2 * SCALE;
const STEM = 31 * SCALE;
const BEAM = 4;
const BEAM_GAP = 6.5;
const STUB = 9;
const EPS = 1e-6;

const y = (pitch: number) => TOP + STAFF - (pitch * GAP) / 2;
const flags = (note: ClassicNote) => Math.max(0, NOTES.indexOf(note) - 2);

type Segment = { level: number; x0: number; x1: number };
type Beam = { racer: number; notes: Symbol[]; segments: Segment[]; at: (x: number) => number };

function runs(system: System): Symbol[][] {
  const out: Symbol[][] = [];
  let run: Symbol[] = [];
  for (const s of system.symbols) {
    const prev = run.at(-1);
    if (prev && (prev.racer !== s.racer || prev.beat !== s.beat || flags(s.note) < 1)) {
      out.push(run);
      run = [];
    }
    if (flags(s.note) >= 1) run.push(s);
  }
  out.push(run);
  return out.filter((r) => r.length > 1);
}

function segments(notes: Symbol[]): Segment[] {
  const out: Segment[] = [];
  const depth = Math.max(...notes.map((s) => flags(s.note)));
  for (let level = 0; level < depth; level++) {
    let i = 0;
    while (i < notes.length) {
      if (flags(notes[i].note) <= level) {
        i++;
        continue;
      }
      let j = i;
      while (j + 1 < notes.length && flags(notes[j + 1].note) > level) j++;
      const left = notes[i].x + STEM_X;
      const right = notes[j].x + STEM_X + STEM_W;
      if (j > i) out.push({ level, x0: left, x1: right });
      else if (i === notes.length - 1) out.push({ level, x0: right - STUB, x1: right });
      else out.push({ level, x0: left, x1: left + STUB });
      i = j + 1;
    }
  }
  return out;
}

export function beams(system: System): Beam[] {
  return runs(system).map((notes) => {
    const x0 = notes[0].x;
    const span = notes.at(-1)!.x - x0;
    const tilt = Math.max(-GAP, Math.min(GAP, y(notes.at(-1)!.pitch) - y(notes[0].pitch)));
    const lift = (x: number) => (tilt * (x - x0)) / span;
    const base = Math.min(...notes.map((s) => y(s.pitch) - STEM - lift(s.x)));
    return { racer: notes[0].racer, notes, segments: segments(notes), at: (x: number) => base + lift(x) };
  });
}

type Piece = { pitch: number; note: ClassicNote; dotted: boolean; start: number; first: boolean; tie: boolean };

function pieces(pitches: number[], beats: number[], from: number): Piece[] {
  const out: Piece[] = [];
  let position = from;
  pitches.forEach((pitch, k) => {
    let left = beats[k];
    let first = true;
    while (left > EPS) {
      const room = (Math.floor((position + EPS) / 4) + 1) * 4 - position;
      const take = Math.min(left, room);
      for (const part of spell(take)) {
        out.push({ pitch, note: part.note, dotted: part.dotted, start: position, first, tie: true });
        first = false;
        position += part.beats;
      }
      left -= take;
    }
    out[out.length - 1].tie = false;
  });
  return out;
}

const onBar = (position: number) => position > EPS && Math.abs(position / 4 - Math.round(position / 4)) < EPS;

export function layout(racers: RacerView[], width: number) {
  const systems: System[] = [];
  const times: number[] = [];
  let system: System = { symbols: [], bars: [], groups: [] };
  let x = START;
  let position = 0;
  let at = 0;
  let id = 0;
  const newSystem = () => {
    systems.push(system);
    system = { symbols: [], bars: [], groups: [] };
    x = START;
  };
  racers.forEach((r, i) => {
    const pitches = r.pitches.slice(0, notesPerBeat(r.note));
    const beats = noteLengths(r.note, pitches).map((l) => l / BEAT_SECONDS);
    const parts = pieces(pitches, beats, position);
    const steps = parts.map((n) => SLOT + EXTRA[n.note] + (n.dotted ? DOT : 0));
    const total = steps.reduce((sum, w) => sum + w, 0);
    let group: Group | null = null;
    let k = -1;
    parts.forEach((part, n) => {
      if (onBar(part.start) && x > START) {
        system.bars.push(x - 4);
        x += BAR - 8;
      }
      const fits = n === 0 ? Math.min(total, width - START - END) : SLOT;
      if (x > START && x + fits > width - END) {
        if (group) system.groups.push(group);
        newSystem();
        group = null;
      }
      group ??= { racer: i, from: x, to: x };
      if (part.first) {
        k++;
        times.push(at);
        at += beats[k] * BEAT_SECONDS;
      }
      system.symbols.push({
        id: id++,
        x,
        pitch: part.pitch,
        note: part.note,
        dotted: part.dotted,
        racer: i,
        beat: Math.floor(part.start + EPS),
        index: times.length - 1,
        tie: part.tie,
        tied: !part.first,
      });
      group.to = x;
      x += steps[n];
    });
    position += beats.reduce((sum, b) => sum + b, 0);
    if (group) system.groups.push(group);
  });
  if (system.symbols.length) systems.push(system);
  return { systems, times };
}

const TIE = 18;

export function ties(system: System): { id: number; racer: number; x0: number; x1: number; y: number }[] {
  const out: { id: number; racer: number; x0: number; x1: number; y: number }[] = [];
  system.symbols.forEach((s, n) => {
    const below = y(s.pitch) + 7;
    if (s.tied && n === 0) out.push({ id: -1, racer: s.racer, x0: s.x - TIE, x1: s.x - 5, y: below });
    if (!s.tie) return;
    const next = system.symbols[n + 1];
    out.push({ id: s.id, racer: s.racer, x0: s.x + 5, x1: next ? next.x - 5 : s.x + TIE, y: below });
  });
  return out;
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
          const joined = beams(system);
          const beamed = new Set(joined.flatMap((b) => b.notes.map((s) => s.id)));
          const tied = ties(system);
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
                    key={s.id}
                    aria-hidden
                    className={`absolute transition-transform duration-100 ${
                      active === s.index
                        ? "scale-125 text-teal-bright"
                        : racer.id === you
                          ? "text-teal"
                          : "text-ink"
                    }`}
                    style={{
                      left: s.x - headX,
                      top: y(s.pitch) - headY,
                      transformOrigin: `${headX}px ${headY}px`,
                    }}
                  >
                    <NoteIcon note={s.note} size={SIZE} stem={!beamed.has(s.id)} />
                    {s.dotted && (
                      <span
                        className="absolute size-[3.5px] rounded-full bg-current"
                        style={{
                          left: headX + (s.note === "whole" ? 12 : 9),
                          top: headY - 1.75 - (s.pitch % 2 === 0 ? GAP / 2 : 0),
                        }}
                      />
                    )}
                  </span>
                );
              })}
              {tied.length > 0 && (
                <svg
                  aria-hidden
                  className="absolute left-0 top-0 overflow-visible"
                  width={right}
                  height={HEIGHT}
                >
                  {tied.map((t) => {
                    const mid = (t.x0 + t.x1) / 2;
                    return (
                      <path
                        key={`${t.id}-${t.x0}`}
                        d={`M${t.x0},${t.y} Q${mid},${t.y + 8} ${t.x1},${t.y} Q${mid},${t.y + 5} ${t.x0},${t.y} Z`}
                        className={ordered[t.racer].id === you ? "fill-teal stroke-teal" : "fill-ink stroke-ink"}
                        strokeWidth={0.6}
                      />
                    );
                  })}
                </svg>
              )}
              {joined.length > 0 && (
                <svg
                  aria-hidden
                  className="absolute left-0 top-0 overflow-visible"
                  width={right}
                  height={HEIGHT}
                >
                  {joined.map((b) => {
                    const color = ordered[b.racer].id === you ? "fill-teal" : "fill-ink";
                    return (
                      <g key={b.notes[0].id} className={color}>
                        {b.notes.map((s) => (
                          <rect
                            key={s.id}
                            x={s.x + STEM_X}
                            y={b.at(s.x)}
                            width={STEM_W}
                            height={y(s.pitch) - b.at(s.x)}
                            className={active === s.index ? "fill-teal-bright" : undefined}
                          />
                        ))}
                        {b.segments.map(({ level, x0, x1 }) => {
                          const top0 = b.at(x0 - STEM_X) + level * BEAM_GAP;
                          const top1 = b.at(x1 - STEM_X - STEM_W) + level * BEAM_GAP;
                          return (
                            <polygon
                              key={`${level}-${x0}`}
                              points={`${x0},${top0} ${x1},${top1} ${x1},${top1 + BEAM} ${x0},${top0 + BEAM}`}
                            />
                          );
                        })}
                      </g>
                    );
                  })}
                </svg>
              )}
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
