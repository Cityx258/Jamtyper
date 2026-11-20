"use client";

import { useEffect, useSyncExternalStore } from "react";
import { musicOn, resumeMusic, setMusic, setTracks, subscribeMusic } from "@/lib/music";
import type { Track } from "@/lib/track";

export default function MusicToggle({
  tracks,
  className,
  onLabel,
  offLabel,
}: {
  tracks: Track[];
  className: string;
  onLabel: string;
  offLabel: string;
}) {
  const on = useSyncExternalStore(subscribeMusic, musicOn, () => false);
  useEffect(() => {
    setTracks(tracks);
    resumeMusic();
  }, [tracks]);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? onLabel : offLabel}
      title={on ? onLabel : offLabel}
      onClick={() => setMusic(!on)}
      className={className}
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
        {!on && <path d="m3 3 18 18" />}
      </svg>
    </button>
  );
}
