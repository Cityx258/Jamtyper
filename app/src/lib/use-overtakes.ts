"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

export type Move = { dir: "up" | "down"; key: number };

type Seen = {
  order: string;
  moves: Record<string, Move>;
  passed: { ids: string[]; key: number } | null;
  tick: number;
};

export function useOvertakes(ids: string[], you: string | null) {
  const order = ids.join(" ");
  const [seen, setSeen] = useState<Seen>({ order, moves: {}, passed: null, tick: 0 });

  if (seen.order !== order) {
    const before = seen.order ? seen.order.split(" ") : [];
    const tick = seen.tick + 1;
    const moves = { ...seen.moves };
    ids.forEach((id, i) => {
      const was = before.indexOf(id);
      if (was === -1 || was === i) return;
      moves[id] = { dir: was > i ? "up" : "down", key: tick };
    });
    let passed = seen.passed;
    if (you && moves[you]?.key === tick && moves[you].dir === "up") {
      const now = ids.indexOf(you);
      const was = before.indexOf(you);
      const behind = ids.slice(now + 1).filter((id) => {
        const old = before.indexOf(id);
        return old !== -1 && old < was;
      });
      if (behind.length > 0) passed = { ids: behind, key: tick };
    }
    setSeen({ order, moves, passed, tick });
  }

  const rows = useRef(new Map<string, HTMLElement>());
  const tops = useRef(new Map<string, number>());

  const row = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) rows.current.set(id, el);
      else rows.current.delete(id);
    },
    [],
  );

  useLayoutEffect(() => {
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next = new Map<string, number>();
    for (const [id, el] of rows.current) {
      const top = el.offsetTop;
      next.set(id, top);
      const old = tops.current.get(id);
      if (calm || old === undefined || old === top) continue;
      el.animate(
        [{ transform: `translateY(${old - top}px)` }, { transform: "none" }],
        { duration: 550, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    }
    tops.current = next;
  });

  return { row, moves: seen.moves, passed: seen.passed };
}
