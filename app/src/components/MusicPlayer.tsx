"use client";

import { useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import {
  currentTrack,
  isPlaying,
  musicOn,
  musicVolume,
  previousTrack,
  setVolume,
  skipTrack,
  subscribeMusic,
  toggleMute,
  togglePause,
} from "@/lib/music";

type Labels = {
  player: string;
  play: string;
  pause: string;
  next: string;
  previous: string;
  volume: string;
  mute: string;
  unmute: string;
};

const control =
  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-teal/10 hover:text-ink";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      {children}
    </svg>
  );
}

export default function MusicPlayer({ t }: { t: Labels }) {
  const on = useSyncExternalStore(subscribeMusic, musicOn, () => false);
  const track = useSyncExternalStore(subscribeMusic, currentTrack, () => null);
  const playing = useSyncExternalStore(subscribeMusic, isPlaying, () => false);
  const volume = useSyncExternalStore(subscribeMusic, musicVolume, () => 0.25);
  if (!on || !track) return null;
  const name = track.artist ? `${track.title} · ${track.artist}` : track.title;
  return (
    <section
      aria-label={t.player}
      className="fixed bottom-4 right-4 z-30 flex h-10 max-w-[calc(100vw-2rem)] items-center gap-0.5 rounded-full border border-line bg-raised/90 pl-1 pr-1 shadow-lg shadow-black/10 backdrop-blur"
    >
      <span
        title={name}
        className="hidden min-w-0 max-w-44 items-center gap-2 pl-2.5 pr-1.5 text-xs sm:flex"
      >
        <span aria-hidden="true" className={`eq shrink-0 ${playing ? "" : "eq-paused"}`}>
          <i />
          <i />
          <i />
        </span>
        <span className="truncate text-ink">{track.title}</span>
      </span>
      <button type="button" onClick={previousTrack} aria-label={t.previous} title={t.previous} className={control}>
        <Icon>
          <path d="M6 5h2v14H6zM20 5v14L9 12z" />
        </Icon>
      </button>
      <button
        type="button"
        onClick={togglePause}
        aria-label={playing ? t.pause : t.play}
        title={playing ? t.pause : t.play}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal text-on-teal transition-colors hover:bg-teal-bright"
      >
        <Icon>{playing ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5v14l11-7z" />}</Icon>
      </button>
      <button type="button" onClick={skipTrack} aria-label={t.next} title={t.next} className={control}>
        <Icon>
          <path d="M16 5h2v14h-2zM4 5v14l11-7z" />
        </Icon>
      </button>
      <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-line" />
      <button
        type="button"
        onClick={toggleMute}
        aria-label={volume > 0 ? t.mute : t.unmute}
        title={volume > 0 ? t.mute : t.unmute}
        className={control}
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" />
          {volume === 0 ? (
            <path d="m22 9-6 6M16 9l6 6" />
          ) : volume < 0.5 ? (
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          ) : (
            <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
          )}
        </svg>
      </button>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(volume * 100)}
        onChange={(e) => setVolume(Number(e.target.value) / 100)}
        aria-label={t.volume}
        aria-valuetext={`${Math.round(volume * 100)}%`}
        title={`${t.volume}: ${Math.round(volume * 100)}%`}
        className="volume mr-2 w-16 shrink-0"
        style={{ "--level": `${volume * 100}%` } as CSSProperties}
      />
    </section>
  );
}
