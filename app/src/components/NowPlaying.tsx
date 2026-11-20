"use client";

import { useSyncExternalStore } from "react";
import { nowPlaying, subscribeMusic } from "@/lib/music";

export default function NowPlaying({ label, by }: { label: string; by: string }) {
  const track = useSyncExternalStore(subscribeMusic, nowPlaying, () => null);
  if (!track) return null;
  const name = track.link ? (
    <a href={track.link} target="_blank" rel="noopener noreferrer" className="text-ink underline decoration-line underline-offset-2 hover:text-teal-bright">
      {track.title}
    </a>
  ) : (
    <span className="text-ink">{track.title}</span>
  );
  return (
    <p aria-live="polite" className="mt-4 flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
      <span aria-hidden="true" className="text-teal">♪</span>
      <span>{label}</span>
      {name}
      {track.artist && (
        <span>
          {by} {track.artist}
        </span>
      )}
      {track.license && <span>· {track.license}</span>}
    </p>
  );
}
