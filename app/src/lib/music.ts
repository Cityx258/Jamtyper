"use client";

import type { Track } from "./tracks";

const KEY = "jamtyper-music";
const VOLUME = 0.25;
const listeners = new Set<() => void>();
let player: HTMLAudioElement | null = null;
let queue: Track[] = [];
let playlist: Track[] = [];
let current: Track | null = null;
let playing = false;
let waiting = false;

function shuffle(tracks: Track[]): Track[] {
  const out = [...tracks];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function notify() {
  listeners.forEach((l) => l());
}

export function nowPlaying(): Track | null {
  return playing ? current : null;
}

export function musicOn(): boolean {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

export function subscribeMusic(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function next(audio: HTMLAudioElement) {
  if (queue.length === 0) queue = shuffle(playlist);
  const track = queue.shift();
  if (!track) return;
  current = track;
  audio.src = track.src;
  notify();
  void start(audio);
}

function element(): HTMLAudioElement {
  if (player) return player;
  player = new Audio();
  player.volume = VOLUME;
  player.preload = "auto";
  player.addEventListener("playing", () => {
    playing = true;
    notify();
  });
  player.addEventListener("pause", () => {
    playing = false;
    notify();
  });
  player.addEventListener("ended", () => player && next(player));
  player.addEventListener("error", () => player && playlist.length > 1 && next(player));
  return player;
}

function retryOnGesture(audio: HTMLAudioElement) {
  if (waiting) return;
  waiting = true;
  const resume = () => {
    waiting = false;
    window.removeEventListener("pointerdown", resume);
    window.removeEventListener("keydown", resume);
    if (musicOn()) void start(audio);
  };
  window.addEventListener("pointerdown", resume);
  window.addEventListener("keydown", resume);
}

async function start(audio: HTMLAudioElement) {
  try {
    await audio.play();
  } catch {
    retryOnGesture(audio);
  }
}

export function setTracks(tracks: Track[]) {
  if (tracks.map((t) => t.src).join("|") === playlist.map((t) => t.src).join("|")) return;
  playlist = tracks;
  queue = [];
}

export function resumeMusic() {
  if (!musicOn() || playlist.length === 0) return;
  const audio = element();
  if (!audio.paused) return;
  if (audio.src) void start(audio);
  else next(audio);
}

export function setMusic(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
  if (on) resumeMusic();
  else player?.pause();
  notify();
}
