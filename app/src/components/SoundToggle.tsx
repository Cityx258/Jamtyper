"use client";

import { useSyncExternalStore } from "react";
import { setSound, soundOn, subscribeSound } from "@/lib/sound";

export default function SoundToggle({
  className,
  onLabel,
  offLabel,
}: {
  className: string;
  onLabel: string;
  offLabel: string;
}) {
  const on = useSyncExternalStore(subscribeSound, soundOn, () => false);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? onLabel : offLabel}
      title={on ? onLabel : offLabel}
      onClick={() => setSound(!on)}
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
        <path d="M11 5 6 9H2v6h4l5 4V5z" />
        {on ? (
          <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
        ) : (
          <path d="m22 9-6 6M16 9l6 6" />
        )}
      </svg>
    </button>
  );
}
