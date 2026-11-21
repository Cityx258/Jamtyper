"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import NoteIcon from "@/components/NoteIcon";
import PlaylistPanel from "@/components/PlaylistPanel";
import { peekSize, type Singer } from "@/lib/notes";
import type { Track } from "@/lib/track";
import { coverFor, lyricsFor } from "@/lib/cover";
import { lineAt, type Lyrics } from "@/lib/lyrics";
import type { Dict } from "@/i18n/en";
import {
  currentTrack,
  isPlaying,
  loadCustomSongs,
  musicOn,
  musicTime,
  musicVolume,
  playTrack,
  previousTrack,
  seekMusic,
  setVolume,
  skipTrack,
  subscribeMusic,
  toggleMute,
  togglePause,
  upcoming,
} from "@/lib/music";

const EMPTY: Track[] = [];
const SHOWN = 8;
const MIKUS: Singer[] = ["mikuMini", "mikuGuitar", "mikuLeek"];
const BAND: Singer[] = ["rin", "gumi", "teto"];
const CREW_SIZE = 44;
const CREW_DELAY_MS = 300;
const STAGGER_MS = 90;
const PANEL_MS = 300;
const SCROLL_SPEED = 30;
const LYRICS_KEY = "jamtyper-lyrics";
const HAND_SCROLL_MS = 3000;

type Panel = "playlist" | "big";

function Marquee({ text, className }: { text: string; className: string }) {
  const outer = useRef<HTMLSpanElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  const [shift, setShift] = useState(0);
  useEffect(() => {
    const a = outer.current;
    const b = inner.current;
    if (!a || !b) return;
    const measure = () => setShift(Math.max(0, b.scrollWidth - a.clientWidth));
    const watch = new ResizeObserver(measure);
    watch.observe(a);
    watch.observe(b);
    return () => watch.disconnect();
  }, []);
  return (
    <span ref={outer} className={`block min-w-0 overflow-hidden whitespace-nowrap ${className}`}>
      <span
        ref={inner}
        className={`inline-block ${shift > 0 ? "marquee" : ""}`}
        style={
          shift > 0
            ? ({ "--shift": `-${shift}px`, animationDuration: `${shift / SCROLL_SPEED + 3}s` } as CSSProperties)
            : undefined
        }
      >
        {text}
      </span>
    </span>
  );
}

function pickCrew(): Singer[] {
  const miku = MIKUS[Math.floor(Math.random() * MIKUS.length)];
  const crew = [miku, ...BAND];
  for (let i = crew.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [crew[i], crew[j]] = [crew[j], crew[i]];
  }
  return crew;
}

function Crew({ up: wanted, crew }: { up: boolean; crew: Singer[] }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setReady(true));
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const up = wanted && ready;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-4 bottom-full -z-10 flex items-end justify-around overflow-hidden px-2 pt-7"
    >
      {crew.map((singer, i) => (
        <div
          key={singer}
          className="origin-bottom transition-transform duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)] motion-reduce:transition-none"
          style={{
            transform: up ? "translateY(0)" : "translateY(115%)",
            transitionDelay: `${(up ? i : crew.length - 1 - i) * STAGGER_MS}ms`,
          }}
        >
          <div
            className={up ? "winner-dance" : ""}
            style={{ animationDelay: `${-i * 0.45}s`, animationDuration: `${1.6 + (i % 2) * 0.3}s` }}
          >
            <NoteIcon note={singer} size={peekSize(singer, CREW_SIZE)} />
          </div>
        </div>
      ))}
    </div>
  );
}

const control =
  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-teal/10 hover:text-ink";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      {children}
    </svg>
  );
}

function Cover({ src, className, note }: { src: string | null; className: string; note: number }) {
  const [cover, setCover] = useState<{ src: string; url: string | null } | null>(null);
  const [broken, setBroken] = useState<string | null>(null);
  useEffect(() => {
    if (!src) return;
    let live = true;
    void coverFor(src).then((url) => live && setCover({ src, url }));
    return () => {
      live = false;
    };
  }, [src]);
  const url = cover && cover.src === src && cover.url !== broken ? cover.url : null;
  return (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center overflow-hidden bg-teal/10 text-teal ${className}`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" onError={() => setBroken(url)} className="h-full w-full object-cover" />
      ) : (
        <svg viewBox="0 0 24 24" width={note} height={note} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l11-2v13" />
          <circle cx="6.5" cy="18" r="2.5" fill="currentColor" />
          <circle cx="17.5" cy="16" r="2.5" fill="currentColor" />
        </svg>
      )}
    </span>
  );
}

function useLyrics(src: string | null): Lyrics | null {
  const [found, setFound] = useState<{ src: string; lyrics: Lyrics | null } | null>(null);
  useEffect(() => {
    if (!src) return;
    let live = true;
    void lyricsFor(src).then((lyrics) => live && setFound({ src, lyrics }));
    return () => {
      live = false;
    };
  }, [src]);
  return found && found.src === src ? found.lyrics : null;
}

function lyricsPreferred(): boolean {
  try {
    return localStorage.getItem(LYRICS_KEY) === "on";
  } catch {
    return false;
  }
}

function preferLyrics(on: boolean) {
  try {
    localStorage.setItem(LYRICS_KEY, on ? "on" : "off");
  } catch {}
}

function LyricsView({ lyrics, label, className }: { lyrics: Lyrics; label: string; className: string }) {
  const box = useRef<HTMLDivElement>(null);
  const handUntil = useRef(0);
  const [active, setActive] = useState(-1);
  useEffect(() => {
    if (!lyrics.synced) return;
    let frame = 0;
    const tick = () => {
      setActive(lineAt(lyrics.lines, musicTime()));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [lyrics]);
  useEffect(() => {
    const el = box.current;
    if (!el || active < 0 || Date.now() < handUntil.current) return;
    const line = el.children[active] as HTMLElement | undefined;
    if (!line) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: line.offsetTop - (el.clientHeight - line.offsetHeight) / 2, behavior: calm ? "auto" : "smooth" });
  }, [active]);
  const hand = () => {
    handUntil.current = Date.now() + HAND_SCROLL_MS;
  };
  return (
    <div
      ref={box}
      role="region"
      aria-label={label}
      tabIndex={0}
      onWheel={hand}
      onTouchMove={hand}
      onKeyDown={hand}
      className={`relative overflow-y-auto overscroll-contain px-2 py-3 ${className}`}
    >
      {lyrics.synced
        ? lyrics.lines.map((line, i) => (
            <button
              key={i}
              type="button"
              tabIndex={-1}
              onClick={() => seekMusic(line.at)}
              aria-current={i === active ? "true" : undefined}
              className={`block w-full rounded-lg px-2 py-1 text-left text-base font-bold leading-snug transition-colors duration-300 hover:bg-teal/10 ${
                i === active ? "text-ink" : "text-muted/70"
              }`}
            >
              {line.text || "♪"}
            </button>
          ))
        : lyrics.lines.map((line, i) =>
            line ? (
              <p key={i} className="px-2 text-sm leading-relaxed text-ink">
                {line}
              </p>
            ) : (
              <br key={i} />
            ),
          )}
    </div>
  );
}

function BigPlayer({ t, track, top }: { t: Dict["player"]; track: Track | null; top?: ReactNode }) {
  const queue = useSyncExternalStore(subscribeMusic, upcoming, () => EMPTY);
  const next = queue.slice(0, SHOWN);
  const lyrics = useLyrics(track?.src ?? null);
  const [wantLyrics, setWantLyrics] = useState(lyricsPreferred);
  const showLyrics = wantLyrics && lyrics !== null;
  const flip = () => {
    setWantLyrics(!showLyrics);
    preferLyrics(!showLyrics);
  };
  return (
    <div
      id="big-player"
      className="absolute bottom-12 left-1/2 -translate-x-1/2 flex max-h-[min(36rem,calc(100vh-6rem))] w-[min(20rem,calc(100vw-2rem))] flex-col rounded-3xl border border-line bg-raised p-3 shadow-xl shadow-black/15"
    >
      {top}
      {showLyrics ? (
        <LyricsView key={track?.src} lyrics={lyrics} label={t.lyrics} className="aspect-square w-full shrink-0 rounded-2xl bg-teal/10" />
      ) : (
        <Cover src={track?.src ?? null} note={64} className="aspect-square w-full rounded-2xl" />
      )}
      <div className="mt-3 flex min-w-0 items-center gap-2 px-1">
        <div className="min-w-0 flex-1">
          <Marquee text={track?.title ?? t.noSong} className={`text-sm font-bold ${track ? "text-ink" : "text-muted"}`} />
          {track?.artist && <p className="truncate text-xs text-muted">{track.artist}</p>}
        </div>
        {lyrics && (
          <button
            type="button"
            onClick={flip}
            aria-pressed={showLyrics}
            aria-label={showLyrics ? t.showCover : t.showLyrics}
            title={showLyrics ? t.showCover : t.showLyrics}
            className={`${control} ${showLyrics ? "bg-teal/10 text-ink" : ""}`}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8" />
            </svg>
          </button>
        )}
      </div>
      {next.length > 0 && (
        <>
          <h2 className="mt-3 px-1 text-xs font-bold uppercase tracking-wide text-muted">{t.upNext}</h2>
          <ul className="mt-1 min-h-0 flex-1 overflow-y-auto">
            {next.map((song) => (
              <li key={song.src}>
                <button
                  type="button"
                  onClick={() => playTrack(song)}
                  className="flex w-full min-w-0 items-center gap-2.5 rounded-2xl px-1.5 py-1.5 text-left transition-colors hover:bg-teal/10"
                >
                  <Cover src={song.src} note={14} className="h-9 w-9 rounded-lg" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm text-ink">{song.title}</span>
                    {song.artist && <span className="truncate text-xs text-muted">{song.artist}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default function MusicPlayer({ t }: { t: Dict["player"] }) {
  const on = useSyncExternalStore(subscribeMusic, musicOn, () => false);
  const track = useSyncExternalStore(subscribeMusic, currentTrack, () => null);
  const playing = useSyncExternalStore(subscribeMusic, isPlaying, () => false);
  const volume = useSyncExternalStore(subscribeMusic, musicVolume, () => 0.25);
  const [panel, setPanelState] = useState<Panel | null>(null);
  const [shown, setShown] = useState<Panel | null>(null);
  const [visible, setVisible] = useState(false);
  const panelTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const open = panel !== null;
  const setPanel = useCallback((next: Panel | null) => {
    clearTimeout(panelTimer.current);
    setPanelState(next);
    setVisible(false);
    if (next) {
      setShown(next);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      panelTimer.current = setTimeout(() => setShown(null), PANEL_MS);
    }
  }, []);
  const box = useRef<HTMLElement>(null);
  const [crew, setCrew] = useState<Singer[] | null>(null);
  const [crewUp, setCrewUp] = useState(false);
  const crewTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(
    () => () => {
      clearTimeout(crewTimer.current);
      clearTimeout(panelTimer.current);
    },
    [],
  );
  useEffect(() => {
    void loadCustomSongs();
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setPanel(null);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open, setPanel]);
  if (!on) return null;
  const crewIn = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(crewTimer.current);
    crewTimer.current = setTimeout(() => {
      if (!crewUp) setCrew(pickCrew());
      requestAnimationFrame(() => requestAnimationFrame(() => setCrewUp(true)));
    }, CREW_DELAY_MS);
  };
  const panelCrew = crew && <Crew up={crewUp} crew={crew} />;
  const crewOut = () => {
    clearTimeout(crewTimer.current);
    setCrewUp(false);
  };
  const title = track?.title ?? t.noSong;
  const name = track?.artist ? `${title} · ${track.artist}` : title;
  return (
    <section
      ref={box}
      onPointerEnter={crewIn}
      onPointerLeave={crewOut}
      aria-label={t.player}
      className="fixed bottom-4 right-4 z-30 flex h-10 max-w-[calc(100vw-2rem)] items-center gap-0.5 rounded-full border border-line bg-raised/90 pl-1 pr-1 shadow-lg shadow-black/10 backdrop-blur"
    >
      {crew && <Crew up={crewUp && !shown} crew={crew} />}
      {shown && (
        <div
          className={`pointer-events-none absolute inset-0 [clip-path:inset(-100vh_-100vw_100%_-100vw)] [&>*]:pointer-events-auto [&>*]:transition-transform [&>*]:duration-300 [&>*]:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:[&>*]:transition-none ${
            visible ? "[&>*]:translate-y-0" : "[&>*]:translate-y-[calc(100%+3rem)]"
          }`}
        >
          {shown === "playlist" ? <PlaylistPanel t={t} top={panelCrew} /> : <BigPlayer t={t} track={track} top={panelCrew} />}
        </div>
      )}
      <span
        title={name}
        className="hidden w-44 shrink-0 items-center gap-2 pl-3 pr-2 text-xs sm:flex"
      >
        <span aria-hidden="true" className={`eq shrink-0 ${playing ? "" : "eq-paused"}`}>
          <i />
          <i />
          <i />
        </span>
        <Marquee text={title} className={`flex-1 ${track ? "text-ink" : "text-muted"}`} />
      </span>
      <button type="button" onClick={previousTrack} aria-label={t.previous} title={t.previous} className={control}>
        <Icon>
          <path d="M6 5h2v14H6zM20 5v14L9 12z" />
        </Icon>
      </button>
      <button
        type="button"
        onClick={togglePause}
        aria-label={playing ? t.pause : t.play}
        title={playing ? t.pause : t.play}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal text-on-teal transition-colors hover:bg-teal-bright"
      >
        <Icon>{playing ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5v14l11-7z" />}</Icon>
      </button>
      <button type="button" onClick={skipTrack} aria-label={t.next} title={t.next} className={control}>
        <Icon>
          <path d="M16 5h2v14h-2zM4 5v14l11-7z" />
        </Icon>
      </button>
      <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-line" />
      <button
        type="button"
        onClick={() => setPanel(panel === "playlist" ? null : "playlist")}
        aria-expanded={panel === "playlist"}
        aria-controls="playlist-panel"
        aria-label={t.playlist}
        title={t.playlist}
        className={`${control} ${panel === "playlist" ? "bg-teal/10 text-ink" : ""}`}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 6h11M4 12h11M4 18h7" />
          <path d="M19 15V5l3 1" />
          <circle cx="17" cy="16" r="2" fill="currentColor" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => setPanel(panel === "big" ? null : "big")}
        aria-expanded={panel === "big"}
        aria-controls="big-player"
        aria-label={panel === "big" ? t.collapse : t.expand}
        title={panel === "big" ? t.collapse : t.expand}
        className={`${control} ${panel === "big" ? "bg-teal/10 text-ink" : ""}`}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {panel === "big" ? <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" /> : <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />}
        </svg>
      </button>
      <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-line" />
      <button
        type="button"
        onClick={toggleMute}
        aria-label={volume > 0 ? t.mute : t.unmute}
        title={volume > 0 ? t.mute : t.unmute}
        className={control}
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" />
          {volume === 0 ? (
            <path d="m22 9-6 6M16 9l6 6" />
          ) : volume < 0.5 ? (
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          ) : (
            <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
          )}
        </svg>
      </button>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(volume * 100)}
        onChange={(e) => setVolume(Number(e.target.value) / 100)}
        aria-label={t.volume}
        aria-valuetext={`${Math.round(volume * 100)}%`}
        title={`${t.volume}: ${Math.round(volume * 100)}%`}
        className="volume mr-2 hidden w-16 shrink-0 sm:block"
        style={{ "--level": `${volume * 100}%` } as CSSProperties}
      />
    </section>
  );
}
