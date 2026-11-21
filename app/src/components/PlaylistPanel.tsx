"use client";

import { useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import type { Dict } from "@/i18n/en";
import {
  addCustomLink,
  addCustomSongs,
  currentTrack,
  customSongs,
  musicSource,
  playTrack,
  removeCustomSong,
  setSource,
  siteSongs,
  subscribeMusic,
  type MusicSource,
} from "@/lib/music";
import type { Track } from "@/lib/track";
import SlidingChoice from "@/components/SlidingChoice";

const EMPTY: Track[] = [];

export default function PlaylistPanel({ t, top }: { t: Dict["player"]; top?: ReactNode }) {
  const source = useSyncExternalStore(subscribeMusic, musicSource, () => "site" as MusicSource);
  const site = useSyncExternalStore(subscribeMusic, siteSongs, () => EMPTY);
  const custom = useSyncExternalStore(subscribeMusic, customSongs, () => EMPTY);
  const current = useSyncExternalStore(subscribeMusic, currentTrack, () => null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const [link, setLink] = useState("");
  const songs = source === "custom" ? custom : site;

  async function add(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setMessage(null);
    const result = await addCustomSongs([...files]);
    setBusy(false);
    if (input.current) input.current.value = "";
    const notes = [];
    if (result.added > 0) notes.push(t.added.replace("{n}", String(result.added)));
    if (result.unplayable > 0) notes.push(t.unplayable.replace("{n}", String(result.unplayable)));
    if (result.full) notes.push(t.full);
    setMessage(notes.join(" "));
  }

  async function addFromLink(e: FormEvent) {
    e.preventDefault();
    if (!link.trim() || busy) return;
    setBusy(true);
    setMessage(null);
    const result = await addCustomLink(link);
    setBusy(false);
    if (result === "added") setLink("");
    setMessage(
      result === "added"
        ? t.added.replace("{n}", "1")
        : result === "invalid"
          ? t.linkInvalid
          : result === "unplayable"
            ? t.linkUnplayable
            : t.full,
    );
  }

  const tab = (value: MusicSource, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={source === value}
      onClick={() => {
        setMessage(null);
        setSource(value);
      }}
      className={`flex-1 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
        source === value ? "text-on-teal" : "text-muted hover:text-ink"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div
      id="playlist-panel"
      className="absolute bottom-12 left-1/2 -translate-x-1/2 flex max-h-[min(28rem,calc(100vh-6rem))] w-[min(20rem,calc(100vw-2rem))] flex-col rounded-3xl border border-line bg-raised p-3 shadow-xl shadow-black/15"
    >
      {top}
      <SlidingChoice role="tablist" aria-label={t.playlist} indicator="rounded-full bg-teal" className="flex gap-1 rounded-full border border-line p-1">
        {tab("site", t.siteList)}
        {tab("custom", t.customList)}
      </SlidingChoice>

      <ul className="mt-3 min-h-0 flex-1 overflow-y-auto">
        {songs.length === 0 && (
          <li className="px-2 py-4 text-center text-xs text-muted">
            {source === "custom" ? t.emptyCustom : t.emptySite}
          </li>
        )}
        {songs.map((song) => {
          const active = song === current;
          return (
            <li key={song.src} className="group flex items-center gap-1">
              <button
                type="button"
                onClick={() => playTrack(song)}
                aria-current={active ? "true" : undefined}
                className={`flex min-w-0 flex-1 flex-col rounded-2xl px-3 py-1.5 text-left transition-colors hover:bg-teal/10 ${
                  active ? "text-teal" : "text-ink"
                }`}
              >
                <span className="truncate text-sm">{song.title}</span>
                {song.artist && <span className="truncate text-xs text-muted">{song.artist}</span>}
              </button>
              {source === "custom" && song.id && (
                <button
                  type="button"
                  onClick={() => song.id && void removeCustomSong(song.id)}
                  aria-label={t.remove.replace("{title}", song.title)}
                  title={t.remove.replace("{title}", song.title)}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted opacity-60 transition hover:bg-danger/10 hover:text-danger hover:opacity-100 focus-visible:opacity-100"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {source === "custom" && (
        <div className="mt-2 rounded-2xl bg-teal/5 p-3">
          <input
            ref={input}
            id="playlist-files"
            type="file"
            accept="audio/*,.opus,.m4a,.flac"
            multiple
            className="peer sr-only"
            onChange={(e) => void add(e.target.files)}
          />
          <label
            htmlFor="playlist-files"
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-full bg-teal px-4 py-2 text-sm font-bold text-on-teal transition-colors hover:bg-teal-bright peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal-bright ${
              busy ? "pointer-events-none opacity-60" : ""
            }`}
          >
            {busy ? t.adding : t.add}
          </label>
          <form onSubmit={addFromLink} className="mt-2 flex gap-1.5">
            <input
              type="url"
              inputMode="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder={t.linkPlaceholder}
              aria-label={t.linkLabel}
              className="min-w-0 flex-1 rounded-full border border-line bg-transparent px-3 py-1.5 text-xs text-ink placeholder:text-muted focus:border-teal focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !link.trim()}
              className="shrink-0 rounded-full border border-teal/60 px-3 py-1.5 text-xs font-bold text-teal transition-colors hover:bg-teal hover:text-on-teal disabled:opacity-50"
            >
              {t.linkAdd}
            </button>
          </form>
          <p className="mt-2 text-center text-[11px] leading-snug text-muted">{t.localHint}</p>
          {message && (
            <p role="status" className="mt-2 text-center text-xs text-ink">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
