"use client";

import { useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import type { Dict } from "@/i18n/en";
import {
  musicOn,
  musicSource,
  musicVolume,
  pausesInRaces,
  setMusic,
  setRacePause,
  setSource,
  setVolume,
  subscribeMusic,
  type MusicSource,
} from "@/lib/music";
import {
  effectsVolume,
  melodyVolume,
  play,
  playMelody,
  setSound,
  setSoundVolume,
  soundOn,
  subscribeSound,
  type SoundChannel,
} from "@/lib/sound";
import type { MelodyNote } from "@/lib/melody";
import { panel } from "@/components/ui";
import SlidingChoice from "@/components/SlidingChoice";

type T = Dict["settings"]["sound"];

const SAMPLE: MelodyNote[] = [
  { pitches: [0, 2], note: "eighth" },
  { pitches: [4], note: "quarter" },
  { pitches: [3, 5], note: "eighth" },
  { pitches: [7], note: "half" },
];

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="min-w-0">
        <p className="font-medium text-ink">{label}</p>
        {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">{children}</div>
    </div>
  );
}

function Switch({ on, onChange, label, t }: { on: boolean; onChange: (on: boolean) => void; label: string; t: T }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="flex items-center gap-3 text-sm text-muted"
    >
      <span className="w-8 text-right">{on ? t.on : t.off}</span>
      <span className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-teal" : "bg-line"}`}>
        <span
          className={`absolute left-0 top-1 h-4 w-4 rounded-full bg-raised shadow transition-transform ${on ? "translate-x-6" : "translate-x-1"}`}
        />
      </span>
    </button>
  );
}

function Slider({
  value,
  onChange,
  onCommit,
  label,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  onCommit?: () => void;
  label: string;
  disabled?: boolean;
}) {
  const pct = Math.round(value * 100);
  return (
    <span className={`flex items-center gap-3 ${disabled ? "opacity-50" : ""}`}>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={pct}
        aria-label={label}
        aria-valuetext={`${pct}%`}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
        className="volume w-40 sm:w-48"
        style={{ "--level": `${pct}%` } as CSSProperties}
      />
      <span className="w-10 text-right font-mono text-xs text-muted">{pct}%</span>
    </span>
  );
}

export default function SoundSettings({ t }: { t: T }) {
  const effects = useSyncExternalStore(subscribeSound, soundOn, () => false);
  const effectsLevel = useSyncExternalStore(subscribeSound, effectsVolume, () => 1);
  const melodyLevel = useSyncExternalStore(subscribeSound, melodyVolume, () => 1);
  const music = useSyncExternalStore(subscribeMusic, musicOn, () => false);
  const musicLevel = useSyncExternalStore(subscribeMusic, musicVolume, () => 0.25);
  const source = useSyncExternalStore(subscribeMusic, musicSource, () => "site" as MusicSource);
  const racePause = useSyncExternalStore(subscribeMusic, pausesInRaces, () => true);
  const level = (channel: SoundChannel) => (v: number) => setSoundVolume(channel, v);

  return (
    <div className={`max-w-3xl divide-y divide-line px-5 sm:px-7 ${panel}`}>
      <Row label={t.effects} hint={t.effectsHint}>
        <Switch on={effects} onChange={setSound} label={t.effects} t={t} />
      </Row>
      <Row label={t.effectsVolume}>
        <Slider value={effectsLevel} onChange={level("effects")} onCommit={() => play("finish", true)} label={t.effectsVolume} disabled={!effects} />
      </Row>
      <Row label={t.melodyVolume} hint={t.melodyHint}>
        <Slider value={melodyLevel} onChange={level("melody")} label={t.melodyVolume} disabled={!effects} />
        <button
          type="button"
          onClick={() => playMelody(SAMPLE, true)}
          className="rounded-full border border-line px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-teal hover:text-ink"
        >
          {t.test}
        </button>
      </Row>
      <Row label={t.music} hint={t.musicHint}>
        <Switch on={music} onChange={setMusic} label={t.music} t={t} />
      </Row>
      <Row label={t.musicVolume}>
        <Slider value={musicLevel} onChange={setVolume} label={t.musicVolume} disabled={!music} />
      </Row>
      <Row label={t.racePause} hint={t.racePauseHint}>
        <Switch on={racePause} onChange={setRacePause} label={t.racePause} t={t} />
      </Row>
      <Row label={t.playlist} hint={t.playlistHint}>
        <SlidingChoice as="span" role="radiogroup" aria-label={t.playlist} indicator="rounded-full bg-teal" className="flex gap-1 rounded-full border border-line p-1">
          {(["site", "custom"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={source === value}
              onClick={() => setSource(value)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                source === value ? "text-on-teal" : "text-muted hover:text-ink"
              }`}
            >
              {value === "site" ? t.siteList : t.customList}
            </button>
          ))}
        </SlidingChoice>
      </Row>
    </div>
  );
}
