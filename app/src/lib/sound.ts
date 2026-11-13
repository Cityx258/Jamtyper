"use client";

import { schedule, type MelodyNote } from "./melody";

export type Cue = "tick" | "go" | "typo" | "finish" | "out";

const KEY = "jamtyper-sound";
const listeners = new Set<() => void>();
let ctx: AudioContext | null = null;

const NOTES: Record<Cue, { freqs: number[]; step: number; length: number; type: OscillatorType; gain: number }> = {
  tick: { freqs: [523.25], step: 0, length: 0.09, type: "triangle", gain: 0.12 },
  go: { freqs: [523.25, 659.25, 783.99], step: 0, length: 0.35, type: "triangle", gain: 0.1 },
  typo: { freqs: [155.56], step: 0, length: 0.07, type: "square", gain: 0.035 },
  finish: { freqs: [523.25, 659.25, 783.99, 1046.5], step: 0.09, length: 0.3, type: "triangle", gain: 0.1 },
  out: { freqs: [392, 329.63, 261.63], step: 0.12, length: 0.25, type: "sine", gain: 0.12 },
};

export function soundOn(): boolean {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

export function setSound(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
  if (on) play("tick");
  listeners.forEach((l) => l());
}

export function subscribeSound(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function audio(): AudioContext | null {
  if (typeof AudioContext === "undefined") return null;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function playMelody(notes: MelodyNote[], force = false): number {
  const ac = (force || soundOn()) && audio();
  const timed = schedule(notes);
  if (!ac) return 0;
  const start = ac.currentTime + 0.05;
  for (const { freq, at, length } of timed) {
    const from = start + at;
    const ring = length + 0.12;
    for (const [mult, level, type] of [
      [1, 0.11, "triangle"],
      [2, 0.025, "sine"],
    ] as const) {
      const osc = ac.createOscillator();
      const amp = ac.createGain();
      osc.type = type;
      osc.frequency.value = freq * mult;
      amp.gain.setValueAtTime(0.0001, from);
      amp.gain.exponentialRampToValueAtTime(level, from + 0.015);
      amp.gain.exponentialRampToValueAtTime(level * 0.45, from + Math.min(0.25, length));
      amp.gain.exponentialRampToValueAtTime(0.0001, from + ring);
      osc.connect(amp).connect(ac.destination);
      osc.start(from);
      osc.stop(from + ring + 0.02);
    }
  }
  const last = timed[timed.length - 1];
  return last ? last.at + last.length : 0;
}

export function play(cue: Cue) {
  if (!soundOn()) return;
  const ctx = audio();
  if (!ctx) return;
  const { freqs, step, length, type, gain } = NOTES[cue];
  const start = ctx.currentTime;
  freqs.forEach((freq, i) => {
    const at = start + i * step;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, at);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + length);
    osc.connect(amp).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + length);
  });
}

export function countdownCue(seconds: number): Cue {
  return seconds > 0 ? "tick" : "go";
}
