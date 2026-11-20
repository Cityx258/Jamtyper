"use client";

import type { Track } from "./tracks";

const KEY = "jamtyper-music";
const VOLUME = 0.25;
const HISTORY = 50;
const RESTART_AFTER = 3;
const listeners = new Set<() => void>();
let player: HTMLAudioElement | null = null;
let playlist: Track[] = [];
let queue: Track[] = [];
let history: Track[] = [];
let current: Track | null = null;
let playing = false;
let held = false;
let waiting = false;
let failures = 0;

const TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  opus: 'audio/ogg; codecs="opus"',
  m4a: 'audio/mp4; codecs="mp4a.40.2"',
  wav: "audio/wav",
  webm: "audio/webm",
  flac: "audio/flac",
};

function playable(track: Track): boolean {
  const ext = track.src.split(".").pop()?.toLowerCase() ?? "";
  const type = TYPES[ext];
  if (!type) return false;
  return new Audio().canPlayType(type) !== "";
}

function shuffle(tracks: Track[]): Track[] {
  const out = [...tracks];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  if (out.length > 1 && out[0] === current) out.push(out.shift()!);
  return out;
}

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeMusic(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function musicOn(): boolean {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

export function currentTrack(): Track | null {
  return current;
}

export function isPlaying(): boolean {
  return playing;
}

export function nowPlaying(): Track | null {
  return playing ? current : null;
}

function load(audio: HTMLAudioElement, track: Track) {
  current = track;
  audio.src = track.src;
  notify();
  if (!held) void start(audio);
}

function next(audio: HTMLAudioElement) {
  if (queue.length === 0) queue = shuffle(playlist);
  const track = queue.shift();
  if (!track) return;
  if (current) history = [...history, current].slice(-HISTORY);
  load(audio, track);
}

function previous(audio: HTMLAudioElement) {
  const back = history.pop();
  if (!back || audio.currentTime > RESTART_AFTER) {
    if (back) history.push(back);
    audio.currentTime = 0;
    if (!held) void start(audio);
    return;
  }
  if (current) queue.unshift(current);
  load(audio, back);
}

function element(): HTMLAudioElement {
  if (player) return player;
  const audio = new Audio();
  audio.volume = VOLUME;
  audio.preload = "auto";
  audio.addEventListener("playing", () => {
    failures = 0;
    playing = true;
    notify();
  });
  audio.addEventListener("pause", () => {
    playing = false;
    notify();
  });
  audio.addEventListener("ended", () => next(audio));
  audio.addEventListener("error", () => {
    failures++;
    if (failures < playlist.length) next(audio);
  });
  player = audio;
  return audio;
}

function retryOnGesture(audio: HTMLAudioElement) {
  if (waiting) return;
  waiting = true;
  const resume = () => {
    waiting = false;
    window.removeEventListener("pointerdown", resume, true);
    window.removeEventListener("keydown", resume, true);
    if (musicOn() && !held && audio.paused) void start(audio);
  };
  window.addEventListener("pointerdown", resume, true);
  window.addEventListener("keydown", resume, true);
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
  playlist = tracks.filter(playable);
  queue = [];
  failures = 0;
}

export function resumeMusic() {
  if (!musicOn() || held || playlist.length === 0) return;
  const audio = element();
  if (!audio.paused) return;
  if (audio.src) void start(audio);
  else next(audio);
}

export function togglePause() {
  if (playlist.length === 0) return;
  const audio = element();
  if (!audio.paused) {
    held = true;
    audio.pause();
    return;
  }
  held = false;
  if (audio.src) void start(audio);
  else next(audio);
}

export function skipTrack() {
  if (playlist.length === 0) return;
  held = false;
  next(element());
}

export function previousTrack() {
  if (playlist.length === 0) return;
  held = false;
  const audio = element();
  if (!audio.src) next(audio);
  else previous(audio);
}

export function setMusic(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
  held = false;
  if (on) resumeMusic();
  else player?.pause();
  notify();
}
