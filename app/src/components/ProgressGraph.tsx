"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Dict } from "@/i18n/en";
import type { Locale } from "@/i18n";
import { dailyAverages, localDay, type RacePoint, timeTicks } from "@/lib/progress-graph";
import { niceMax } from "@/lib/race-graph";

type Props = {
  points: RacePoint[];
  locale: Locale;
  t: Dict["profile"]["progress"];
};

const PAD = { top: 12, right: 16, bottom: 28, left: 40 };
const DAY_MS = 86_400_000;

export default function ProgressGraph({ points, locale, t }: Props) {
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
  const days = useMemo(() => dailyAverages(points, (at) => localDay(at)), [points]);
  if (points.length < 2) return null;

  const H = W < 500 ? 200 : 260;
  const PLOT_W = W - PAD.left - PAD.right;
  const PLOT_H = H - PAD.top - PAD.bottom;
  const first = points[0].at;
  const last = points[points.length - 1].at;
  const span = last - first || 1;
  const top = niceMax(Math.max(...points.map((p) => p.wpm)));
  const x = (at: number) => PAD.left + ((at - first) / span) * PLOT_W;
  const y = (wpm: number) => PAD.top + PLOT_H - (Math.min(wpm, top) / top) * PLOT_H;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(top * f));
  const tickFormat = new Intl.DateTimeFormat(
    locale,
    last - first < DAY_MS ? { hour: "numeric", minute: "2-digit" } : { month: "short", day: "numeric" },
  );
  const hoverFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const ticks = timeTicks(first, last, W < 500 ? 3 : 5);
  const dayLine = days
    .map((d, i) => `${i ? "L" : "M"}${x(d.at).toFixed(1)},${y(d.wpm).toFixed(1)}`)
    .join("");

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    for (let i = 1; i < points.length; i++) {
      if (Math.abs(x(points[i].at) - px) < Math.abs(x(points[best].at) - px)) best = i;
    }
    setHover(best);
  }

  const hovered = hover === null ? null : points[hover];
  const hoveredDay = hovered ? days.find((d) => d.day === localDay(hovered.at)) : undefined;
  const hoverLeft = hovered ? (x(hovered.at) / W) * 100 : 0;

  return (
    <section className="mt-16" aria-labelledby="progress-title">
      <h2 id="progress-title" className="font-display text-3xl">
        {t.title}
      </h2>
      <p className="mt-2 max-w-xl text-muted">{t.hint}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-muted/70" />
          {t.race}
        </span>
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-5 rounded-full bg-teal" />
          {t.daily}
        </span>
      </div>
      <div ref={box} className="relative mt-4">
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          className="block touch-none select-none"
          role="img"
          aria-label={t.summary
            .replace("{count}", String(points.length))
            .replace("{first}", String(Math.round(days[0].wpm)))
            .replace("{last}", String(Math.round(days[days.length - 1].wpm)))}
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
          {ticks.map((at, i) => (
            <text
              key={i}
              x={x(at)}
              y={H - 8}
              textAnchor={i === 0 ? "start" : i === ticks.length - 1 ? "end" : "middle"}
              className="fill-muted font-mono text-[11px]"
            >
              {tickFormat.format(at)}
            </text>
          ))}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={x(p.at)}
              cy={y(p.wpm)}
              r={3.5}
              fill="var(--muted)"
              fillOpacity={0.55}
              stroke="var(--bg)"
              strokeWidth={1}
            />
          ))}
          {days.length > 1 && (
            <>
              <path d={dayLine} fill="none" stroke="var(--bg)" strokeWidth={5} strokeLinejoin="round" />
              <path
                d={dayLine}
                fill="none"
                stroke="var(--teal)"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </>
          )}
          {days.map((d) => (
            <circle
              key={d.day}
              cx={x(d.at)}
              cy={y(d.wpm)}
              r={4}
              fill="var(--teal)"
              stroke="var(--bg)"
              strokeWidth={2}
            />
          ))}
          {hovered && (
            <>
              <line
                x1={x(hovered.at)}
                x2={x(hovered.at)}
                y1={PAD.top}
                y2={PAD.top + PLOT_H}
                stroke="var(--muted)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <circle
                cx={x(hovered.at)}
                cy={y(hovered.wpm)}
                r={5}
                fill="var(--ink)"
                stroke="var(--bg)"
                strokeWidth={2}
              />
            </>
          )}
        </svg>
        {hovered && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-40 rounded-lg border border-line bg-raised px-3 py-2 text-xs shadow-lg"
            style={hoverLeft > 60 ? { right: `${100 - hoverLeft + 2}%` } : { left: `${hoverLeft + 2}%` }}
          >
            <p className="font-mono text-muted">{hoverFormat.format(hovered.at)}</p>
            <p className="mt-1 flex justify-between gap-4 text-ink">
              <span>{t.thisRace}</span>
              <span className="font-mono">
                {Math.round(hovered.wpm)} {t.wpm}
              </span>
            </p>
            {hoveredDay && (
              <p className="flex justify-between gap-4 text-ink">
                <span>
                  {hoveredDay.races === 1
                    ? t.dayAverageOne
                    : t.dayAverage.replace("{n}", String(hoveredDay.races))}
                </span>
                <span className="font-mono">
                  {Math.round(hoveredDay.wpm)} {t.wpm}
                </span>
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
