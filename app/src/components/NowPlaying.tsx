"use client";

import { useSyncExternalStore } from "react";
import { nowPlaying, subscribeMusic } from "@/lib/music";

export default function NowPlaying({ label, by }: { label: string; by: string }) {
  const track = useSyncExternalStore(subscribeMusic, nowPlaying, () => null);
  if (!track) return <p aria-live="polite" className="h-8" />;
  const credits = [track.title, track.artist && `${by} ${track.artist}`, track.license].filter(Boolean).join(" ");
  const name = track.link ? (
    <a href={track.link} target="_blank" rel="noopener noreferrer" className="text-ink underline decoration-line underline-offset-2 hover:text-teal-bright">
      {track.title}
    </a>
  ) : (
    <span className="text-ink">{track.title}</span>
  );
  return (
    <p aria-live="polite" title={credits} className="h-8 truncate text-xs leading-8 text-muted">
      <span aria-hidden="true" className="mr-1.5 text-teal">♪</span>
      {label} {name}
      {track.artist && ` ${by} ${track.artist}`}
      {track.license && ` · ${track.license}`}
    </p>
  );
}
