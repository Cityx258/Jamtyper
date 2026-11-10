"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import RaceResults from "@/components/RaceResults";
import RaceScreen from "@/components/RaceScreen";
import { primaryButton, secondaryButton } from "@/components/ui";
import type { Dict } from "@/i18n/en";
import type { RacerView, RoomError, RoomView } from "@/lib/room-protocol";
import {
  getSocket,
  requestAction,
  requestJoinRoom,
  requestLeaveRoom,
} from "@/lib/socket";

type Props = {
  code: string | null;
  accountName: string | null;
  t: Dict["room"];
};

const NAME_KEY = "jt-guest-name";

function readStoredName(): string | null {
  try {
    return sessionStorage.getItem(NAME_KEY);
  } catch {
    return null;
  }
}

const noSubscribe = () => () => {};
const noStoredName = () => null;

function QuarterNote() {
  return (
    <svg
      viewBox="0 0 28 40"
      width="14"
      height="20"
      fill="currentColor"
      aria-hidden="true"
      className="shrink-0 text-teal"
    >
      <ellipse cx="9" cy="33" rx="7" ry="5" transform="rotate(-22 9 33)" />
      <rect x="14.2" y="4" width="2" height="29" rx="1" />
    </svg>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted">
      {children}
    </span>
  );
}

function Message({
  text,
  t,
  action,
}: {
  text: string;
  t: Props["t"];
  action?: React.ReactNode;
}) {
  return (
    <div className="max-w-md">
      <p role="alert" className="font-display text-2xl leading-snug">
        {text}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {action}
        <Link href="/" className={secondaryButton}>
          {t.backHome}
        </Link>
      </div>
    </div>
  );
}

export default function RoomLobby({ code, accountName, t }: Props) {
  const router = useRouter();
  const storedName = useSyncExternalStore(
    noSubscribe,
    readStoredName,
    noStoredName,
  );
  const [chosenName, setChosenName] = useState<string | null>(null);
  const guestName = chosenName ?? storedName ?? undefined;
  const ready = !!accountName || !!guestName;
  const [draftName, setDraftName] = useState("");
  const [room, setRoom] = useState<RoomView | null>(null);
  const [you, setYou] = useState<string | null>(null);
  const [error, setError] = useState<RoomError | null>(code ? null : "bad_request");
  const [closed, setClosed] = useState(false);
  const [live, setLive] = useState(true);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [offset, setOffset] = useState(0);
  const [actionError, setActionError] = useState<RoomError | null>(null);

  useEffect(() => {
    if (!code || !ready) return;
    let cancelled = false;
    const socket = getSocket();

    async function join() {
      setLive(true);
      try {
        const res = await requestJoinRoom(code!, accountName ? undefined : guestName);
        if (cancelled) return;
        if (res.ok) {
          receive(res.room);
          setYou(res.you);
          setError(null);
        } else {
          setError(res.error);
        }
      } catch {
        if (!cancelled) setError("server_error");
      }
    }
    function receive(view: RoomView) {
      setRoom(view);
      if (view.race) setOffset(view.race.serverNow - Date.now());
    }
    const onState = (view: RoomView) => {
      if (view.code === code) receive(view);
    };
    const onPositions = (racers: RacerView[]) =>
      setRoom((r) => (r?.race ? { ...r, race: { ...r.race, racers } } : r));
    const onClosed = () => setClosed(true);
    const onDisconnect = () => setLive(false);

    socket.on("connect", join);
    socket.on("disconnect", onDisconnect);
    socket.on("room:state", onState);
    socket.on("room:closed", onClosed);
    socket.on("race:positions", onPositions);
    if (socket.connected) void join();
    else socket.connect();

    return () => {
      cancelled = true;
      socket.off("connect", join);
      socket.off("disconnect", onDisconnect);
      socket.off("room:state", onState);
      socket.off("room:closed", onClosed);
      socket.off("race:positions", onPositions);
      socket.disconnect();
    };
  }, [code, ready, accountName, guestName]);

  async function copy(what: "code" | "link") {
    if (!code) return;
    const text = what === "code" ? code : `${location.origin}/room/${code}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
    } catch {
    }
  }

  async function act(
    event: "race:start" | "race:cancel" | "race:again" | "race:forfeit" | "room:close",
  ) {
    setActionError(null);
    const res = await requestAction(event);
    if (!res.ok) setActionError(res.error);
  }

  async function leave() {
    try {
      await requestLeaveRoom();
    } catch {
    }
    router.push("/");
  }

  if (error) {
    return <Message text={t.errors[error]} t={t} />;
  }
  if (closed) {
    return <Message text={t.closed} t={t} />;
  }

  if (!ready) {
    return (
      <form
        className="w-full max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          const name = draftName.trim();
          if (!name) return;
          try {
            sessionStorage.setItem(NAME_KEY, name);
          } catch {
          }
          setChosenName(name);
        }}
      >
        <h1 className="font-display text-3xl">{t.nameTitle}</h1>
        <p className="mt-3 text-muted">{t.nameHint}</p>
        <label className="mt-6 block">
          <span className="mb-1.5 block text-sm text-muted">{t.nameLabel}</span>
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            maxLength={20}
            autoFocus
            autoComplete="nickname"
            className="w-full rounded-lg border border-line bg-bg/70 px-4 py-3 text-ink focus:border-teal focus:outline-none"
          />
        </label>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={!draftName.trim()}
            className={primaryButton}
          >
            {t.nameAction}
          </button>
          <span className="text-sm text-muted">
            {t.signInInstead}{" "}
            <Link
              href="/login"
              className="text-teal underline underline-offset-4 hover:text-teal-bright"
            >
              {t.signIn}
            </Link>
          </span>
        </div>
      </form>
    );
  }

  if (!room) {
    return <p className="text-muted">{t.joining}</p>;
  }

  const isHost = !!room.members.find((m) => m.id === you)?.isHost;
  const readyRacers = room.members.filter(
    (m) => m.role === "racer" && m.connected,
  ).length;
  const banner = (
    <>
      {!live && (
        <p role="status" className="mb-6 text-sm text-danger">
          {t.connectionLost}
        </p>
      )}
      {actionError && (
        <p role="alert" className="mb-6 text-sm text-danger">
          {t.errors[actionError]}
        </p>
      )}
    </>
  );

  if (room.race && room.status !== "lobby") {
    return (
      <div className="w-full">
        {banner}
        {room.status === "results" ? (
          <RaceResults
            race={room.race}
            you={you}
            isHost={isHost}
            t={t}
            onAgain={() => act("race:again")}
            onClose={() => act("room:close")}
          />
        ) : (
          <RaceScreen
            status={room.status}
            race={room.race}
            you={you}
            offset={offset}
            isHost={isHost}
            t={t}
            onCancel={() => act("race:cancel")}
            onForfeit={() => act("race:forfeit")}
          />
        )}
        <button type="button" onClick={leave} className={`mt-10 ${secondaryButton}`}>
          {t.leave}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {banner}

      <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal">
        {t.kicker}
      </p>
      <div className="relative mt-4">
        <div className="staff absolute inset-x-0 top-[calc(var(--staff-gap)*0.5)]" />
        <h1
          className="relative font-display text-5xl tracking-[0.18em] sm:text-7xl"
          aria-label={room.code.split("").join(" ")}
        >
          {room.code}
        </h1>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => copy("code")} className={secondaryButton}>
          {copied === "code" ? t.copied : t.copyCode}
        </button>
        <button type="button" onClick={() => copy("link")} className={secondaryButton}>
          {copied === "link" ? t.copied : t.copyLink}
        </button>
      </div>

      <section className="mt-12" aria-label={t.players}>
        <h2 className="font-display text-2xl">
          {t.players}{" "}
          <span className="font-mono text-base text-muted">
            {room.members.length}
          </span>
        </h2>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {room.members.map((m) => (
            <li
              key={m.id}
              className={`flex items-center gap-3 py-3 ${m.connected ? "" : "opacity-50"}`}
            >
              <QuarterNote />
              <span className="min-w-0 flex-1 truncate font-medium">{m.name}</span>
              {m.isHost && <Tag>{t.host}</Tag>}
              {m.id === you && <Tag>{t.you}</Tag>}
              {m.role === "spectator" && <Tag>{t.spectator}</Tag>}
              {!m.connected && <Tag>{t.reconnecting}</Tag>}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 max-w-xl text-muted">{t.waiting}</p>

      {isHost ? (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => act("race:start")}
            disabled={readyRacers < room.minRacers}
            className={primaryButton}
          >
            {t.start}
          </button>
          {readyRacers < room.minRacers && (
            <p className="mt-3 text-sm text-muted">
              {t.needPlayers.replace("{n}", String(room.minRacers))}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-6 text-teal">{t.waitingHost}</p>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <button type="button" onClick={leave} className={secondaryButton}>
          {t.leave}
        </button>
        {isHost && (
          <button type="button" onClick={() => act("room:close")} className={secondaryButton}>
            {t.closeRoom}
          </button>
        )}
      </div>
    </div>
  );
}
