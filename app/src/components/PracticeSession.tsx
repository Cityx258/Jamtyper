"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import KeyHeatmap from "@/components/KeyHeatmap";
import TypingBox from "@/components/TypingBox";
import { primaryButton, secondaryButton } from "@/components/ui";
import type { Dict } from "@/i18n/en";
import type { ProgressPayload } from "@/lib/room-protocol";
import { generateText } from "@/lib/texts";

const COUNTDOWN_MS = 3_000;

type Props = {
  t: Dict["practice"];
  heatmapT: Dict["profile"]["heatmap"];
};

type Session = {
  text: string;
  startsAt: number;
  finishedAt: number | null;
};

const EMPTY: ProgressPayload = { position: 0, mistakes: 0, missed: {} };

function clock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-xs uppercase tracking-wider text-muted">
        {label}
      </span>
      <span className="font-display text-4xl">{value}</span>
    </div>
  );
}

export default function PracticeSession({ t, heatmapT }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [progress, setProgress] = useState<ProgressPayload>(EMPTY);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!session || session.finishedAt) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [session]);

  function start() {
    setSession({
      text: generateText(),
      startsAt: Date.now() + COUNTDOWN_MS,
      finishedAt: null,
    });
    setProgress(EMPTY);
    setNow(Date.now());
  }

  const onProgress = useCallback((p: ProgressPayload) => {
    setProgress(p);
    setSession((s) =>
      s && !s.finishedAt && p.position === s.text.length
        ? { ...s, finishedAt: Date.now() }
        : s,
    );
  }, []);

  if (!session) {
    return (
      <div className="w-full">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal">
          {t.kicker}
        </p>
        <div className="relative mt-4">
          <div className="staff absolute inset-x-0 top-[calc(var(--staff-gap)*0.5)]" />
          <h1 className="relative font-display text-5xl sm:text-7xl">{t.heading}</h1>
        </div>
        <p className="mt-8 max-w-xl text-lg text-muted">{t.intro}</p>
        <button type="button" onClick={start} className={`mt-8 ${primaryButton}`}>
          {t.start}
        </button>
      </div>
    );
  }

  if (now < session.startsAt) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal">
          {t.getReady}
        </p>
        <p className="mt-6 font-display text-8xl" aria-live="polite">
          {Math.ceil((session.startsAt - now) / 1000)}
        </p>
      </div>
    );
  }

  const elapsed = (session.finishedAt ?? now) - session.startsAt;
  const wpm = elapsed > 0 ? Math.round(progress.position / 5 / (elapsed / 60_000)) : 0;
  const strokes = progress.position + progress.mistakes;
  const accuracy = strokes ? Math.round((progress.position / strokes) * 100) : 100;

  if (session.finishedAt) {
    return (
      <div className="w-full">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal">
          {t.kicker}
        </p>
        <h1 className="mt-4 font-display text-5xl">{t.done}</h1>

        <div className="mt-10 flex flex-wrap gap-x-12 gap-y-6 border-y border-line py-6">
          <Stat label={t.wpm} value={String(wpm)} />
          <Stat label={t.accuracy} value={`${accuracy}%`} />
          <Stat label={t.time} value={clock(elapsed)} />
        </div>

        <section className="mt-12 max-w-2xl">
          <h2 className="font-display text-2xl">{t.yourMisses}</h2>
          <div className="mt-4">
            <KeyHeatmap missed={progress.missed} t={heatmapT} />
          </div>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <button type="button" onClick={start} className={primaryButton}>
            {t.again}
          </button>
          <Link href="/" className={secondaryButton}>
            {t.backHome}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <p className="font-mono text-sm text-muted">
          {clock(elapsed)} <span className="ml-4 text-ink">{wpm}</span> {t.wpm}
        </p>
        <button type="button" onClick={start} className={secondaryButton}>
          {t.restart}
        </button>
      </div>
      <div className="mt-8">
        <TypingBox
          key={session.startsAt}
          text={session.text}
          start={0}
          label={t.typeHere}
          onProgress={onProgress}
        />
      </div>
      <div className="mt-8 h-2 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-teal transition-[width] duration-200"
          style={{ width: `${(progress.position / session.text.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
