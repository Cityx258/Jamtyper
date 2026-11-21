"use client";

import type { NoteKind, Singer } from "./notes";

const KEY = "jamtyper-beam";
const MIKUS: Singer[] = ["mikuMini", "mikuGuitar", "mikuLeek"];
export const WORD_AT = [40, 1420, 2670, 3770, 4470, 5170];
export const CHARGE_AT = WORD_AT[4];
export const FIRE_AT = WORD_AT[5];
export const SWAP_AT = FIRE_AT + 250;
export const DONE_AT = SWAP_AT + 800;

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
