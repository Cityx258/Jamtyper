"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import NoteIcon from "@/components/NoteIcon";
import { iconSize, SINGERS, type Singer } from "@/lib/notes";

const SIZE = 64;
const EDGE = 28;
const LEAVE_MS = 300;

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

    function show(card: Element) {
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
        top: rect.top + window.scrollY - box + 1,
        box,
        tilt: Math.random() * 16 - 8,
        up: false,
      });
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setPeek((p) => (p && p.id === id ? { ...p, up: true } : p))),
      );
    }

    function hide() {
      current.current = null;
      setPeek((p) => p && { ...p, up: false });
      clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => setPeek((p) => (p && !p.up ? null : p)), LEAVE_MS);
    }

    function onOver(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      const card = e.target instanceof Element ? e.target.closest(".card") : null;
      if (card === current.current) return;
      if (!card) return hide();
      clearTimeout(leaveTimer);
      current.current = card;
      show(card);
    }

    function onOut(e: PointerEvent) {
      if (!e.relatedTarget) hide();
    }

    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    return () => {
      clearTimeout(leaveTimer);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
    };
  }, []);

  if (!peek) return null;
  return createPortal(
    <div
      aria-hidden
      className="pointer-events-none absolute z-20 flex items-end justify-center overflow-hidden"
      style={{ left: peek.left, top: peek.top, width: peek.box, height: peek.box }}
    >
      <div
        className="origin-bottom transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none"
        style={{ transform: peek.up ? `translateY(0) rotate(${peek.tilt}deg)` : "translateY(110%)" }}
      >
        <NoteIcon note={peek.note} size={SIZE} />
      </div>
    </div>,
    document.body,
  );
}
