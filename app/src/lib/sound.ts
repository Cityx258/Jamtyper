"use client";

import { keystrokeMidi, midiToFreq, nextStep } from "./keystroke";
import { schedule, type MelodyNote } from "./melody";

export type Cue = "tick" | "go" | "finish" | "out";

export type SoundChannel = "effects" | "melody";

const KEY = "jamtyper-sound";
const VOLUME_KEYS: Record<SoundChannel, string> = {
  effects: "jamtyper-effects-volume",
  melody: "jamtyper-melody-volume",
};
const listeners = new Set<() => void>();
let ctx: AudioContext | null = null;
const volumes: Record<SoundChannel, number | null> = { effects: null, melody: null };
const buses: Partial<Record<SoundChannel, GainNode>> = {};
let keyStep: number | null = null;

function readVolume(channel: SoundChannel): number {
  const cached = volumes[channel];
  if (cached !== null) return cached;
  let value = 1;
  try {
    const saved = localStorage.getItem(VOLUME_KEYS[channel]);
    const n = Number(saved);
    if (saved !== null && n >= 0 && n <= 1) value = n;
  } catch {}
  volumes[channel] = value;
  return value;
}

export const effectsVolume = () => readVolume("effects");
export const melodyVolume = () => readVolume("melody");

export function setSoundVolume(channel: SoundChannel, value: number) {
  const v = Math.min(1, Math.max(0, value));
  volumes[channel] = v;
  try {
    localStorage.setItem(VOLUME_KEYS[channel], String(v));
  } catch {}
  const bus = buses[channel];
  if (bus && ctx) bus.gain.setValueAtTime(v, ctx.currentTime);
  listeners.forEach((l) => l());
}

function bus(ac: AudioContext, channel: SoundChannel): GainNode {
  let node = buses[channel];
  if (!node) {
    node = ac.createGain();
    node.gain.value = readVolume(channel);
    node.connect(ac.destination);
    buses[channel] = node;
  }
  return node;
}

const NOTES: Record<Cue, { freqs: number[]; step: number; length: number; type: OscillatorType; gain: number }> = {
  tick: { freqs: [523.25], step: 0, length: 0.09, type: "triangle", gain: 0.12 },
  go: { freqs: [523.25, 659.25, 783.99], step: 0, length: 0.35, type: "triangle", gain: 0.1 },
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
      osc.connect(amp).connect(bus(ac, "melody"));
      osc.start(from);
      osc.stop(from + ring + 0.02);
    }
  }
  const last = timed[timed.length - 1];
  return last ? last.at + last.length : 0;
}

export function play(cue: Cue, force = false) {
  if (!force && !soundOn()) return;
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
    osc.connect(amp).connect(bus(ctx, "effects"));
    osc.start(at);
    osc.stop(at + length);
  });
}

export function playKeystroke(inKey: boolean) {
  if (!soundOn()) return;
  const ac = audio();
  if (!ac) return;
  keyStep = nextStep(keyStep);
  const freq = midiToFreq(keystrokeMidi(keyStep, inKey));
  const at = ac.currentTime;
  const length = inKey ? 0.22 : 0.3;
  const voices: [number, number, OscillatorType][] = inKey
    ? [
        [1, 0.07, "triangle"],
        [2, 0.012, "sine"],
      ]
    : [
        [1, 0.06, "triangle"],
        [1.03, 0.04, "sawtooth"],
      ];
  for (const [mult, level, type] of voices) {
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq * mult;
    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.exponentialRampToValueAtTime(level, at + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + length);
    osc.connect(amp).connect(bus(ac, "effects"));
    osc.start(at);
    osc.stop(at + length + 0.02);
  }
}

export function countdownCue(seconds: number): Cue {
  return seconds > 0 ? "tick" : "go";
}
