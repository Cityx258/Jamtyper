"use client";

import { fromFileName } from "./track";

export type StoredSong = {
  id: string;
  title: string;
  artist: string | null;
  type: string;
  blob: Blob | null;
  url: string | null;
  added: number;
};

export type AddResult = { added: number; unplayable: number; full: boolean };

export type LinkResult = "added" | "invalid" | "unplayable" | "full";

const DB = "jamtyper-songs";
const STORE = "songs";
export const MAX_SONG_BYTES = 50 * 1024 * 1024;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return open().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = work(tx.objectStore(STORE));
        tx.oncomplete = () => {
          db.close();
          resolve(req ? req.result : undefined);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
        tx.onabort = () => {
          db.close();
          reject(tx.error);
        };
      }),
  );
}

export async function allSongs(): Promise<StoredSong[]> {
  try {
    const songs = (await run<StoredSong[]>("readonly", (s) => s.getAll())) ?? [];
    return songs.sort((a, b) => a.added - b.added);
  } catch {
    return [];
  }
}

function playable(file: File): boolean {
  if (!file.type.startsWith("audio/") && !/\.(opus|m4a|flac)$/i.test(file.name)) return false;
  if (file.size === 0 || file.size > MAX_SONG_BYTES) return false;
  const type = file.type || (file.name.endsWith(".opus") ? 'audio/ogg; codecs="opus"' : "audio/mp4");
  return new Audio().canPlayType(type) !== "";
}

export async function addSongs(files: File[]): Promise<AddResult> {
  const result: AddResult = { added: 0, unplayable: 0, full: false };
  const now = Date.now();
  for (const [i, file] of files.entries()) {
    if (!playable(file)) {
      result.unplayable++;
      continue;
    }
    const { title, artist } = fromFileName(file.name);
    const song: StoredSong = { id: crypto.randomUUID(), title, artist, type: file.type, blob: file, url: null, added: now + i };
    try {
      await run("readwrite", (s) => s.put(song));
      result.added++;
    } catch {
      result.full = true;
      break;
    }
  }
  return result;
}

export function parseLink(raw: string): URL | null {
  try {
    const url = new URL(raw.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

export function linkName(url: URL): string {
  const last = url.pathname.split("/").filter(Boolean).pop() ?? "";
  try {
    return decodeURIComponent(last) || url.hostname;
  } catch {
    return last || url.hostname;
  }
}

function canStream(url: string, timeoutMs = 10_000): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = new Audio();
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      probe.removeAttribute("src");
      probe.load();
      resolve(ok);
    };
    const timer = setTimeout(() => done(false), timeoutMs);
    probe.preload = "metadata";
    probe.addEventListener("loadedmetadata", () => done(true), { once: true });
    probe.addEventListener("error", () => done(false), { once: true });
    probe.src = url;
  });
}

export async function addLink(raw: string): Promise<LinkResult> {
  const url = parseLink(raw);
  if (!url) return "invalid";
  if (!(await canStream(url.href))) return "unplayable";
  const { title, artist } = fromFileName(linkName(url));
  const song: StoredSong = { id: crypto.randomUUID(), title, artist, type: "", blob: null, url: url.href, added: Date.now() };
  try {
    await run("readwrite", (s) => s.put(song));
    return "added";
  } catch {
    return "full";
  }
}

export async function removeSong(id: string): Promise<void> {
  try {
    await run("readwrite", (s) => s.delete(id));
  } catch {}
}
