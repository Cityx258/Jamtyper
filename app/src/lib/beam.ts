"use client";

import type { NoteKind, Singer } from "./notes";

const KEY = "jamtyper-beam";
const MIKUS: Singer[] = ["mikuMini", "mikuGuitar", "mikuLeek"];
const listeners = new Set<() => void>();

export function beamOn(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setBeam(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
  listeners.forEach((l) => l());
}

export function subscribeBeam(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function beamSinger(racers: { place: number | null; note: NoteKind }[], seed: number): Singer {
  const winner = racers.find((r) => r.place === 1);
  if (winner && (MIKUS as NoteKind[]).includes(winner.note)) return winner.note as Singer;
  return MIKUS[Math.abs(Math.floor(seed)) % MIKUS.length];
}
