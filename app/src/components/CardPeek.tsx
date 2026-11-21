"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import NoteIcon from "@/components/NoteIcon";
import { iconSize, SINGERS, type Singer } from "@/lib/notes";

const SIZE = 64;
const EDGE = 28;
const DELAY_MS = 450;
const LEAVE_MS = 500;
const HEADROOM = 28;
const SIDE = 10;

type Peek = {
  id: number;
  note: Singer;
  left: number;
  top: number;
  box: number;
  tilt: number;
  up: boolean;
};

export default function CardPeek() {
  const [peek, setPeek] = useState<Peek | null>(null);
  const current = useRef<Element | null>(null);
  const last = useRef<Singer | null>(null);
  const count = useRef(0);

  useEffect(() => {
    let leaveTimer: ReturnType<typeof setTimeout> | undefined;
    let showTimer: ReturnType<typeof setTimeout> | undefined;

    function show(card: Element) {
      clearTimeout(leaveTimer);
      const rect = card.getBoundingClientRect();
      const choices = SINGERS.filter((s) => s !== last.current);
      const note = choices[Math.floor(Math.random() * choices.length)];
      last.current = note;
      const box = Math.round(iconSize(note, SIZE) * 1.3);
      const room = Math.max(0, rect.width - box - EDGE * 2);
      const id = ++count.current;
      setPeek({
        id,
        note,
        left: rect.left + window.scrollX + EDGE + Math.random() * room,
        top: rect.top + window.scrollY - box - HEADROOM + 1,
        box,
        tilt: Math.random() * 16 - 8,
        up: false,
      });
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setPeek((p) => (p && p.id === id ? { ...p, up: true } : p))),
      );
    }

    function hide() {
      clearTimeout(showTimer);
      setPeek((p) => p && { ...p, up: false });
      clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => setPeek((p) => (p && !p.up ? null : p)), LEAVE_MS);
    }

    function onOver(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      const card = e.target instanceof Element ? e.target.closest(".card") : null;
      if (card === current.current) return;
      current.current = card;
      hide();
      if (card) showTimer = setTimeout(() => show(card), DELAY_MS);
    }

    function onOut(e: PointerEvent) {
      if (e.relatedTarget) return;
      current.current = null;
      hide();
    }

    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(showTimer);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
    };
  }, []);

  if (!peek) return null;
  return createPortal(
    <div
      aria-hidden
      className="pointer-events-none absolute z-20 flex items-end justify-center overflow-hidden"
      style={{ left: peek.left - SIDE, top: peek.top, width: peek.box + SIDE * 2, height: peek.box + HEADROOM }}
    >
      <div
        className="origin-bottom transition-transform duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)] motion-reduce:transition-none"
        style={{ transform: peek.up ? `translateY(0) rotate(${peek.tilt}deg)` : "translateY(110%)" }}
      >
        <div className={peek.up ? "winner-dance" : ""}>
          <NoteIcon note={peek.note} size={SIZE} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
