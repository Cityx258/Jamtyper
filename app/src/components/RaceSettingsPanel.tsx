"use client";

import { useRef, useState } from "react";
import type { Dict } from "@/i18n/en";
import {
  LENGTH_MAX,
  LENGTH_MIN,
  TIME_LIMITS,
  type SettingsView,
} from "@/lib/race-settings";

type T = Dict["room"]["settings"];

type Props = {
  settings: SettingsView;
  editable: boolean;
  t: T;
  onChange: (patch: Record<string, unknown>) => Promise<unknown>;
};

const chip =
  "rounded-full border px-3.5 py-1.5 text-sm transition-colors disabled:cursor-default";
const chipOn = "border-teal bg-teal/15 font-medium text-ink";
const chipOff = "border-line text-muted enabled:hover:border-teal enabled:hover:text-ink";

function useDraft<V>(value: V, send: (v: V) => Promise<unknown>) {
  const [draft, setDraft] = useState<{ v: V } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  function change(v: V) {
    setDraft({ v });
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await send(v);
      setDraft((d) => (d?.v === v ? null : d));
    }, 350);
  }
  return [draft ? draft.v : value, change] as const;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        {label}
      </span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

export function Choice<V extends string | number>({
  options,
  value,
  label,
  editable,
  onPick,
}: {
  options: readonly V[];
  value: V;
  label: (v: V) => string;
  editable: boolean;
  onPick: (v: V) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={String(o)}
          type="button"
          disabled={!editable}
          aria-pressed={o === value}
          onClick={() => o !== value && onPick(o)}
          className={`${chip} ${o === value ? chipOn : chipOff} ${
            !editable && o !== value ? "hidden" : ""
          }`}
        >
          {label(o)}
        </button>
      ))}
    </div>
  );
}

function timeLabel(sec: number, t: T) {
  return sec < 60
    ? t.seconds.replace("{n}", String(sec))
    : t.minutes.replace("{n}", String(sec / 60));
}

export default function RaceSettingsPanel({ settings, editable, t, onChange }: Props) {
  const [length, setLength] = useDraft(settings.length, (v) => onChange({ length: v }));

  return (
    <section className="mt-10" aria-labelledby="settings-title">
      <h2 id="settings-title" className="font-display text-2xl">
        {t.title}
      </h2>
      {!editable && <p className="mt-1 text-sm text-muted">{t.hostOnly}</p>}
      <div className="mt-5 grid gap-6 sm:grid-cols-2">
        <Field label={t.length}>
          {editable ? (
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={LENGTH_MIN}
                max={LENGTH_MAX}
                step={5}
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                aria-label={t.length}
                className="w-full max-w-64 accent-teal"
              />
              <span className="w-24 font-mono text-sm">
                {t.lengthWords.replace("{n}", String(length))}
              </span>
            </div>
          ) : (
            <span className="font-medium">
              {t.lengthWords.replace("{n}", String(settings.length))}
            </span>
          )}
        </Field>
        <Field label={t.timeLimit}>
          <Choice
            options={TIME_LIMITS}
            value={settings.timeLimitSec as (typeof TIME_LIMITS)[number]}
            label={(v) => timeLabel(v, t)}
            editable={editable}
            onPick={(v) => onChange({ timeLimitSec: v })}
          />
        </Field>
      </div>
    </section>
  );
}
