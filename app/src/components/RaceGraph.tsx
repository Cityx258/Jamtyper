"use client";

import { useEffect, useRef, useState } from "react";
import type { Dict } from "@/i18n/en";
import { niceMax, sampleTime } from "@/lib/race-graph";
import type { RacerView } from "@/lib/room-protocol";

type Props = {
  racers: RacerView[];
  you: string | null;
  t: Dict["room"]["graph"];
};

const PAD = { top: 12, right: 12, bottom: 28, left: 40 };
const TOOLTIP_ROWS = 5;

function timeTicks(maxSeconds: number, most: number): number[] {
  const step = [1, 2, 5, 10, 15, 30, 60, 120].find((s) => maxSeconds / s <= most) ?? 120;
  const ticks: number[] = [];
  for (let s = step; s <= maxSeconds; s += step) ticks.push(s);
  return ticks;
}

export default function RaceGraph({ racers, you, t }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const [W, setW] = useState(640);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setW(Math.round(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const H = W < 500 ? 200 : 280;
  const PLOT_W = W - PAD.left - PAD.right;
  const PLOT_H = H - PAD.top - PAD.bottom;
  const lines = racers.flatMap((r) =>
    r.samples && r.samples.length > 1 ? [{ ...r, s: r.samples }] : [],
  );
  if (lines.length === 0) return null;

  const focusId = lines.some((r) => r.id === you) ? you : lines[0].id;
  const focus = lines.find((r) => r.id === focusId) ?? lines[0];
  const count = Math.max(...lines.map((r) => r.s.length));
  const endTime = sampleTime(count - 1);
  const top = niceMax(Math.max(...lines.flatMap((r) => r.s)));
  const x = (i: number) => PAD.left + ((sampleTime(i) - sampleTime(0)) / (endTime - sampleTime(0) || 1)) * PLOT_W;
  const y = (wpm: number) => PAD.top + PLOT_H - (Math.min(wpm, top) / top) * PLOT_H;
  const path = (samples: number[]) =>
    samples.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(top * f));
  const others = lines.filter((r) => r.id !== focusId);

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * W;
    const ratio = (px - PAD.left) / PLOT_W;
    setHover(Math.max(0, Math.min(count - 1, Math.round(ratio * (count - 1)))));
  }

  const hoverRows =
    hover === null
      ? []
      : lines
          .filter((r) => hover < r.s.length)
          .map((r) => ({ r, wpm: r.s[hover] }))
          .sort((a, b) => (a.r.id === focusId ? -1 : b.r.id === focusId ? 1 : b.wpm - a.wpm))
          .slice(0, TOOLTIP_ROWS);
  const hoverLeft = hover === null ? 0 : (x(hover) / W) * 100;
  const peak = Math.max(...focus.s);

  return (
    <section className="mt-12" aria-labelledby="graph-title">
      <h2 id="graph-title" className="font-display text-2xl">
        {t.title}
      </h2>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-5 rounded-full bg-teal" />
          {focusId === you ? t.you : focus.name}
        </span>
        {others.length > 0 && (
          <span className="flex items-center gap-2">
            <span className="h-0.5 w-5 rounded-full bg-muted/60" />
            {t.others}
          </span>
        )}
      </div>
      <div ref={box} className="relative mt-4">
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          className="block touch-none select-none"
          role="img"
          aria-label={t.summary
            .replace("{name}", focusId === you ? t.you : focus.name)
            .replace("{peak}", String(peak))
            .replace("{end}", String(focus.s[focus.s.length - 1]))}
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={() => setHover(null)}
        >
          {yTicks.map((v) => (
            <g key={v}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(v)}
                y2={y(v)}
                stroke="var(--line)"
                strokeOpacity={v === 0 ? 1 : 0.6}
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={y(v)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-muted font-mono text-[11px]"
              >
                {v}
              </text>
            </g>
          ))}
          {timeTicks(endTime, W < 500 ? 4 : 8).map((s) => {
            const px = PAD.left + ((s - sampleTime(0)) / (endTime - sampleTime(0) || 1)) * PLOT_W;
            return px < PAD.left ? null : (
              <text
                key={s}
                x={px}
                y={H - 8}
                textAnchor="middle"
                className="fill-muted font-mono text-[11px]"
              >
                {t.seconds.replace("{n}", String(s))}
              </text>
            );
          })}
          {others.map((r) => (
            <path
              key={r.id}
              d={path(r.s)}
              fill="none"
              stroke="var(--muted)"
              strokeOpacity={0.55}
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          <path
            d={path(focus.s)}
            fill="none"
            stroke="var(--bg)"
            strokeWidth={5}
            strokeLinejoin="round"
          />
          <path
            d={path(focus.s)}
            fill="none"
            stroke="var(--teal)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {hover !== null && (
            <>
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={PAD.top}
                y2={PAD.top + PLOT_H}
                stroke="var(--muted)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              {hover < focus.s.length && (
                <circle
                  cx={x(hover)}
                  cy={y(focus.s[hover])}
                  r={4.5}
                  fill="var(--teal)"
                  stroke="var(--bg)"
                  strokeWidth={2}
                />
              )}
            </>
          )}
        </svg>
        {hover !== null && hoverRows.length > 0 && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-40 rounded-lg border border-line bg-raised px-3 py-2 text-xs shadow-lg"
            style={
              hoverLeft > 60
                ? { right: `${100 - hoverLeft + 2}%` }
                : { left: `${hoverLeft + 2}%` }
            }
          >
            <p className="font-mono text-muted">
              {t.seconds.replace("{n}", sampleTime(hover).toFixed(1))}
            </p>
            <ul className="mt-1 space-y-0.5">
              {hoverRows.map(({ r, wpm }) => (
                <li key={r.id} className="flex justify-between gap-4 text-ink">
                  <span className={`truncate ${r.id === focusId ? "font-medium" : ""}`}>
                    {r.id === you ? t.you : r.name}
                  </span>
                  <span className="font-mono">
                    {wpm} {t.wpm}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
