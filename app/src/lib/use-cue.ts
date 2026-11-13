"use client";

import { useEffect, useRef } from "react";
import { play, type Cue } from "./sound";

export function useCue<V>(value: V, cueFor: (next: V) => Cue | null) {
  const prev = useRef(value);
  useEffect(() => {
    if (Object.is(prev.current, value)) return;
    prev.current = value;
    const cue = cueFor(value);
    if (cue) play(cue);
  });
}
