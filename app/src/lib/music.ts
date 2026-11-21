"use client";

import { addLink, addSongs, allSongs, removeSong, type AddResult, type LinkResult } from "./song-store";
import type { Track } from "./track";

export type MusicSource = "site" | "custom";

const KEY = "jamtyper-music";
const VOLUME_KEY = "jamtyper-music-volume";
const SOURCE_KEY = "jamtyper-music-source";
const RACE_PAUSE_KEY = "jamtyper-music-race-pause";
const DEFAULT_VOLUME = 0.25;
const HISTORY = 50;
const RESTART_AFTER = 3;
const listeners = new Set<() => void>();
let player: HTMLAudioElement | null = null;
let playlist: Track[] = [];
let siteTracks: Track[] = [];
let customTracks: Track[] = [];
let siteKey = "";
let source: MusicSource | null = null;
let queue: Track[] = [];
let history: Track[] = [];
let current: Track | null = null;
let playing = false;
let held = false;
let racing = false;
let racePause: boolean | null = null;
let waiting = false;
let failures = 0;
let volume: number | null = null;
let unmuted = DEFAULT_VOLUME;

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

export function musicVolume(): number {
  if (volume !== null) return volume;
  try {
    const saved = Number(localStorage.getItem(VOLUME_KEY));
    volume = localStorage.getItem(VOLUME_KEY) !== null && saved >= 0 && saved <= 1 ? saved : DEFAULT_VOLUME;
  } catch {
    volume = DEFAULT_VOLUME;
  }
  if (volume > 0) unmuted = volume;
  return volume;
}

export function setVolume(next: number) {
  volume = Math.min(1, Math.max(0, next));
  if (volume > 0) unmuted = volume;
  try {
    localStorage.setItem(VOLUME_KEY, String(volume));
  } catch {}
  if (player) player.volume = volume;
  notify();
}

export function toggleMute() {
  setVolume(musicVolume() > 0 ? 0 : unmuted);
}

export function currentTrack(): Track | null {
  return current;
}

export function upcoming(): Track[] {
  return queue;
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
  if (!held && !hushed()) void start(audio);
}

function next(audio: HTMLAudioElement) {
  if (queue.length === 0) queue = shuffle(playlist);
  const [track, ...rest] = queue;
  if (!track) return;
  queue = rest;
  if (current) history = [...history, current].slice(-HISTORY);
  load(audio, track);
}

function previous(audio: HTMLAudioElement) {
  const back = history.pop();
  if (!back || audio.currentTime > RESTART_AFTER) {
    if (back) history.push(back);
    audio.currentTime = 0;
    if (!held && !hushed()) void start(audio);
    return;
  }
  if (current) queue = [current, ...queue];
  load(audio, back);
}

function element(): HTMLAudioElement {
  if (player) return player;
  const audio = new Audio();
  audio.volume = musicVolume();
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
    if (musicOn() && !held && !hushed() && audio.paused) void start(audio);
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

export function musicSource(): MusicSource {
  if (source) return source;
  try {
    source = localStorage.getItem(SOURCE_KEY) === "custom" ? "custom" : "site";
  } catch {
    source = "site";
  }
  return source;
}

export function siteSongs(): Track[] {
  return siteTracks;
}

export function customSongs(): Track[] {
  return customTracks;
}

function refresh() {
  playlist = musicSource() === "custom" ? customTracks : siteTracks;
  queue = queue.filter((t) => playlist.includes(t));
  history = history.filter((t) => playlist.includes(t));
  failures = 0;
}

function unload(audio: HTMLAudioElement) {
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  current = null;
  playing = false;
}

export function setTracks(tracks: Track[]) {
  const key = tracks.map((t) => t.src).join("|");
  if (key === siteKey) return;
  siteKey = key;
  siteTracks = tracks.filter(playable);
  refresh();
  notify();
}

export async function loadCustomSongs() {
  const songs = await allSongs();
  const old = new Map(customTracks.map((t) => [t.id, t]));
  customTracks = songs.map(
    (s) =>
      old.get(s.id) ?? {
        id: s.id,
        src: s.url ?? (s.blob ? URL.createObjectURL(s.blob) : ""),
        title: s.title,
        artist: s.artist,
        license: null,
        link: s.url ?? null,
      },
  );
  customTracks = customTracks.filter((t) => t.src);
  for (const t of old.values()) if (!customTracks.includes(t) && t !== current) release(t);
  refresh();
  if (musicSource() === "custom") resumeMusic();
  notify();
}

function release(track: Track) {
  if (track.src.startsWith("blob:")) URL.revokeObjectURL(track.src);
}

export async function addCustomLink(raw: string): Promise<LinkResult> {
  const result = await addLink(raw);
  if (result === "added") await loadCustomSongs();
  return result;
}

export async function addCustomSongs(files: File[]): Promise<AddResult> {
  const result = await addSongs(files);
  await loadCustomSongs();
  return result;
}

export async function removeCustomSong(id: string) {
  await removeSong(id);
  const removed = current?.id === id ? current : null;
  await loadCustomSongs();
  if (removed && player) {
    if (playlist.length > 0) next(player);
    else unload(player);
    release(removed);
    notify();
  }
}

export function setSource(value: MusicSource) {
  if (value === musicSource()) return;
  source = value;
  try {
    localStorage.setItem(SOURCE_KEY, value);
  } catch {}
  queue = [];
  history = [];
  refresh();
  if (player) unload(player);
  held = false;
  resumeMusic();
  notify();
}

export function playTrack(track: Track) {
  if (!playlist.includes(track)) return;
  racing = false;
  held = false;
  queue = queue.filter((t) => t !== track);
  if (current) history = [...history, current].slice(-HISTORY);
  load(element(), track);
}

export function resumeMusic() {
  if (!musicOn() || held || hushed() || playlist.length === 0) return;
  const audio = element();
  if (!audio.paused) return;
  if (audio.src) void start(audio);
  else next(audio);
}

export function pausesInRaces(): boolean {
  if (racePause !== null) return racePause;
  try {
    racePause = localStorage.getItem(RACE_PAUSE_KEY) !== "off";
  } catch {
    racePause = true;
  }
  return racePause;
}

function hushed(): boolean {
  return racing && pausesInRaces();
}

function settle() {
  if (hushed()) player?.pause();
  else resumeMusic();
}

export function setRacePause(on: boolean) {
  racePause = on;
  try {
    localStorage.setItem(RACE_PAUSE_KEY, on ? "on" : "off");
  } catch {}
  settle();
  notify();
}

export function pauseForRace(on: boolean) {
  racing = on;
  settle();
}

export function togglePause() {
  if (playlist.length === 0) return;
  racing = false;
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
  racing = false;
  held = false;
  next(element());
}

export function previousTrack() {
  if (playlist.length === 0) return;
  racing = false;
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
