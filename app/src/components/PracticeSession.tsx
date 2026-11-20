"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import KeyHeatmap from "@/components/KeyHeatmap";
import KeyboardOnly from "@/components/KeyboardOnly";
import TypingBox from "@/components/TypingBox";
import { kicker, panel, primaryButton, secondaryButton, tile } from "@/components/ui";
import type { Dict } from "@/i18n/en";
import { clearRank, THANK_YOU_WPM } from "@/lib/miku";
import type { ProgressPayload } from "@/lib/room-protocol";
import { DEFAULT_SETTINGS } from "@/lib/race-settings";
import { countdownCue } from "@/lib/sound";
import { generateText } from "@/lib/texts";
import { useCue } from "@/lib/use-cue";

const COUNTDOWN_MS = 3_000;

type Props = {
  t: Dict["practice"];
  heatmapT: Dict["profile"]["heatmap"];
  ranks: Dict["room"]["ranks"];
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
    <div className={`@container flex min-w-0 flex-col gap-1 px-5 py-4 ${tile}`}>
      <span className="font-mono text-xs uppercase tracking-wider text-muted">
        {label}
      </span>
      <span className="whitespace-nowrap font-display text-[min(2.25rem,12cqw)] leading-10">{value}</span>
    </div>
  );
}

export default function PracticeSession({ t, heatmapT, ranks }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [progress, setProgress] = useState<ProgressPayload>(EMPTY);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!session || session.finishedAt) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [session]);

  const counting = session && !session.finishedAt && now > 0;
  useCue(counting ? Math.max(0, Math.ceil((session.startsAt - now) / 1000)) : 0, countdownCue);
  useCue(!!session?.finishedAt, (finished) => (finished ? "finish" : null));

  function start() {
    setSession({
      text: generateText(DEFAULT_SETTINGS)!.text,
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
        <p className={kicker}>
          {t.kicker}
        </p>
        <div className="relative mt-4">
          <h1 className="relative font-display text-5xl sm:text-7xl">{t.heading}</h1>
        </div>
        <span aria-hidden="true" className="ribbon mt-5" />
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
        <p className={`${kicker} self-center`}>
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
        <p className={kicker}>
          {t.kicker}
        </p>
        <h1 className="mt-4 font-display text-5xl">{t.done}</h1>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={t.wpm} value={String(wpm)} />
          <Stat label={t.accuracy} value={`${accuracy}%`} />
          <Stat label={t.time} value={clock(elapsed)} />
          <Stat label={t.clearRank} value={ranks[clearRank(strokes ? progress.position / strokes : 1, progress.mistakes)]} />
        </div>
        {wpm === THANK_YOU_WPM && (
          <p role="status" className="mt-6 rounded-2xl border border-teal bg-teal/10 px-4 py-3 font-medium text-ink">
            {t.thankYou}
          </p>
        )}

        <section className="mt-12 max-w-2xl">
          <h2 className="font-display text-2xl">{t.yourMisses}</h2>
          <div className={`mt-4 p-5 sm:p-7 ${panel}`}>
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
        <KeyboardOnly message={t.physicalKeyboard}>
          <TypingBox
            key={session.startsAt}
            text={session.text}
            start={0}
            label={t.typeHere}
            onProgress={onProgress}
          />
        </KeyboardOnly>
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
