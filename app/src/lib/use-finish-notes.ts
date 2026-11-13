"use client";

import { useEffect, useRef } from "react";
import type { RacerView } from "./room-protocol";
import { playMelody } from "./sound";

export function useFinishNotes(racers: RacerView[]) {
  const heard = useRef<Set<string> | null>(null);
  useEffect(() => {
    const finished = racers.filter((r) => r.outcome === "finished");
    if (!heard.current) {
      heard.current = new Set(finished.map((r) => r.id));
      return;
    }
    const fresh = finished
      .filter((r) => !heard.current!.has(r.id))
      .sort((a, b) => (a.place ?? 0) - (b.place ?? 0));
    if (!fresh.length) return;
    fresh.forEach((r) => heard.current!.add(r.id));
    playMelody(fresh.map((r) => ({ pitch: r.pitch, note: r.note })));
  }, [racers]);
}
