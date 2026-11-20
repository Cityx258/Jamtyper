"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import {
  currentTrack,
  isPlaying,
  musicOn,
  previousTrack,
  skipTrack,
  subscribeMusic,
  togglePause,
} from "@/lib/music";

type Labels = {
  player: string;
  play: string;
  pause: string;
  next: string;
  previous: string;
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
    </section>
  );
}
