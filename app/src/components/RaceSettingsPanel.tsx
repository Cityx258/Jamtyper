"use client";

import { useMemo, useRef, useState } from "react";
import type { Dict } from "@/i18n/en";
import {
  CHARS_MAX,
  CUSTOM_MAX,
  DIFFICULTIES,
  LANGUAGES,
  LENGTH_MAX,
  LENGTH_MIN,
  SOURCES,
  TEXT_THEMES,
  TIME_LIMITS,
  isCodeLanguage,
  type SettingsView,
} from "@/lib/race-settings";
import { generateText } from "@/lib/texts";

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

export function Toggle({
  on,
  label,
  editable,
  onLabel,
  offLabel,
  onFlip,
}: {
  on: boolean;
  label: string;
  editable: boolean;
  onLabel: string;
  offLabel: string;
  onFlip: (v: boolean) => void;
}) {
  if (!editable) return <span className="font-medium">{on ? onLabel : offLabel}</span>;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onFlip(!on)}
      className="flex items-center gap-3 self-start text-sm"
    >
      <span
        className={`relative h-6 w-11 rounded-full border transition-colors ${
          on ? "border-teal bg-teal/30" : "border-line bg-bg/70"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4.5 w-4.5 rounded-full transition-all ${
            on ? "left-5.5 bg-teal" : "left-0.5 bg-muted"
          }`}
        />
      </span>
      <span className={on ? "text-ink" : "text-muted"}>{on ? onLabel : offLabel}</span>
    </button>
  );
}

function CharsInput({
  value,
  label,
  editable,
  none,
  onEdit,
}: {
  value: string;
  label: string;
  editable: boolean;
  none: string;
  onEdit: (v: string) => void;
}) {
  if (!editable) {
    return value ? (
      <span className="font-mono tracking-[0.3em]">{value}</span>
    ) : (
      <span className="text-muted">{none}</span>
    );
  }
  return (
    <input
      value={value}
      onChange={(e) => onEdit(e.target.value)}
      maxLength={CHARS_MAX}
      aria-label={label}
      autoComplete="off"
      autoCapitalize="off"
      spellCheck={false}
      placeholder={none}
      className="w-full max-w-64 rounded-lg border border-line bg-bg/70 px-3 py-2 font-mono tracking-[0.3em] text-ink placeholder:tracking-normal placeholder:text-muted/60 focus:border-teal focus:outline-none"
    />
  );
}

function timeLabel(sec: number, t: T) {
  return sec < 60
    ? t.seconds.replace("{n}", String(sec))
    : t.minutes.replace("{n}", String(sec / 60));
}

export default function RaceSettingsPanel({ settings, editable, t, onChange }: Props) {
  const [length, setLength] = useDraft(settings.length, (v) => onChange({ length: v }));
  const [blacklist, setBlacklist] = useDraft(settings.blacklist, (v) =>
    onChange({ blacklist: v }),
  );
  const [priority, setPriority] = useDraft(settings.priority, (v) =>
    onChange({ priority: v }),
  );
  const impossible = useMemo(
    () =>
      editable &&
      settings.source !== "custom" &&
      generateText({ ...settings, customText: "" }) === null,
    [editable, settings],
  );
  const [custom, setCustom] = useState("");
  const customTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isCustom = settings.source === "custom";
  const lengthText = (n: number) =>
    (settings.source === "quote" ? t.lengthAbout : t.lengthWords).replace("{n}", String(n));

  function editCustom(value: string) {
    setCustom(value);
    clearTimeout(customTimer.current);
    customTimer.current = setTimeout(() => onChange({ customText: value }), 400);
  }

  return (
    <section className="mt-10" aria-labelledby="settings-title">
      <h2 id="settings-title" className="font-display text-2xl">
        {t.title}
      </h2>
      {!editable && <p className="mt-1 text-sm text-muted">{t.hostOnly}</p>}
      {impossible && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {t.impossible}
        </p>
      )}
      <div className="mt-5 grid gap-6 sm:grid-cols-2">
        <Field label={t.source}>
          <Choice
            options={SOURCES}
            value={settings.source}
            label={(v) => t.sources[v]}
            editable={editable}
            onPick={(v) => onChange({ source: v })}
          />
        </Field>
        {!isCustom && (
          <Field label={t.language}>
            <Choice
              options={LANGUAGES}
              value={settings.language}
              label={(v) => t.languages[v]}
              editable={editable}
              onPick={(v) => onChange({ language: v })}
            />
          </Field>
        )}
        {!isCustom && !isCodeLanguage(settings.language) && (
          <Field label={t.theme}>
            <Choice
              options={TEXT_THEMES}
              value={settings.theme}
              label={(v) => t.themes[v]}
              editable={editable}
              onPick={(v) => onChange({ theme: v })}
            />
          </Field>
        )}
        {settings.source === "words" && (
          <Field label={t.difficulty} hint={t.difficultyHints[settings.difficulty]}>
            <Choice
              options={DIFFICULTIES}
              value={settings.difficulty}
              label={(v) => t.difficulties[v]}
              editable={editable}
              onPick={(v) => onChange({ difficulty: v })}
            />
          </Field>
        )}
        {settings.source === "words" && !isCodeLanguage(settings.language) && (
          <Field label={t.punctuation} hint={t.punctuationHint}>
            <Toggle
              on={settings.punctuation}
              label={t.punctuation}
              editable={editable}
              onLabel={t.on}
              offLabel={t.off}
              onFlip={(v) => onChange({ punctuation: v })}
            />
          </Field>
        )}
        {settings.source === "words" && settings.language === "fr" && (
          <Field label={t.accents} hint={t.accentsHint}>
            <Toggle
              on={settings.accents}
              label={t.accents}
              editable={editable}
              onLabel={t.on}
              offLabel={t.off}
              onFlip={(v) => onChange({ accents: v })}
            />
          </Field>
        )}
        {isCustom && (
          <div className="sm:col-span-2">
            <Field
              label={t.customLabel}
              hint={
                editable
                  ? t.customSaved.replace("{n}", String(settings.customLength))
                  : undefined
              }
            >
              {editable ? (
                <textarea
                  value={custom}
                  onChange={(e) => editCustom(e.target.value)}
                  maxLength={CUSTOM_MAX}
                  rows={4}
                  placeholder={t.customPlaceholder}
                  aria-label={t.customLabel}
                  className="w-full rounded-lg border border-line bg-bg/70 px-4 py-3 text-ink focus:border-teal focus:outline-none"
                />
              ) : (
                <span className="text-muted">
                  {t.customHidden.replace("{n}", String(settings.customLength))}
                </span>
              )}
            </Field>
          </div>
        )}
        {!isCustom && (
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
                <span className="w-32 font-mono text-sm">{lengthText(length)}</span>
              </div>
            ) : (
              <span className="font-medium">{lengthText(settings.length)}</span>
            )}
          </Field>
        )}
        {!isCustom && (
          <Field label={t.blacklist} hint={t.blacklistHint}>
            <CharsInput
              value={blacklist}
              label={t.blacklist}
              editable={editable}
              none={t.noChars}
              onEdit={setBlacklist}
            />
          </Field>
        )}
        {!isCustom && (
          <Field label={t.priority} hint={t.priorityHint}>
            <CharsInput
              value={priority}
              label={t.priority}
              editable={editable}
              none={t.noChars}
              onEdit={setPriority}
            />
          </Field>
        )}
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
