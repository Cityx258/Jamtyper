"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import KickButton from "@/components/KickButton";
import NoteIcon from "@/components/NoteIcon";
import RaceResults from "@/components/RaceResults";
import RaceScreen from "@/components/RaceScreen";
import RaceSettingsPanel from "@/components/RaceSettingsPanel";
import {
  primaryButton,
  secondaryButton,
  smallButton,
} from "@/components/ui";
import type { Dict } from "@/i18n/en";
import {
  VISIBILITIES,
  type ActionResult,
  type RacerView,
  type RoomError,
  type RoomView,
} from "@/lib/room-protocol";
import { botPlan } from "@/lib/bot-plan";
import {
  getSocket,
  requestAction,
  requestAnswerWatch,
  requestConfigure,
  requestInvite,
  requestJoinRoom,
  requestKick,
  requestLeaveRoom,
  requestPromote,
  requestTeam,
  requestVisibility,
  requestWatch,
} from "@/lib/socket";

type Props = {
  code: string | null;
  invite: string | null;
  accountName: string | null;
  t: Dict["room"];
  heatmapT: Dict["profile"]["heatmap"];
  noteNames: Dict["profile"]["notes"]["names"];
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

export default function RoomLobby({
  code,
  invite,
  accountName,
  t,
  heatmapT,
  noteNames,
}: Props) {
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
  const [copied, setCopied] = useState<"code" | "link" | "invite" | null>(null);
  const [offset, setOffset] = useState(0);
  const [actionError, setActionError] = useState<RoomError | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const inviteRef = useRef(invite);

  useEffect(() => {
    if (!code || !ready) return;
    let cancelled = false;
    const socket = getSocket();

    async function join() {
      setLive(true);
      try {
        const res = await requestJoinRoom(
          code!,
          accountName ? undefined : guestName,
          inviteRef.current ?? undefined,
        );
        if (cancelled) return;
        if (res.ok) {
          if (inviteRef.current) {
            inviteRef.current = null;
            window.history.replaceState(null, "", `/room/${code}`);
          }
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
    const onKicked = () => setError("kicked");
    const onDisconnect = () => setLive(false);

    socket.on("connect", join);
    socket.on("disconnect", onDisconnect);
    socket.on("room:state", onState);
    socket.on("room:closed", onClosed);
    socket.on("room:kicked", onKicked);
    socket.on("race:positions", onPositions);
    if (socket.connected) void join();
    else socket.connect();

    return () => {
      cancelled = true;
      socket.off("connect", join);
      socket.off("disconnect", onDisconnect);
      socket.off("room:state", onState);
      socket.off("room:closed", onClosed);
      socket.off("room:kicked", onKicked);
      socket.off("race:positions", onPositions);
      socket.disconnect();
    };
  }, [code, ready, accountName, guestName]);

  async function copy(what: "code" | "link" | "invite") {
    if (!code) return;
    const text =
      what === "code"
        ? code
        : what === "link"
          ? `${location.origin}/room/${code}`
          : inviteUrl;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
    } catch {
    }
  }

  async function run(request: Promise<ActionResult>) {
    setActionError(null);
    const res = await request;
    if (!res.ok) setActionError(res.error);
  }

  const act = (
    event: "race:start" | "race:cancel" | "race:again" | "race:forfeit" | "room:close",
  ) => run(requestAction(event));

  async function newInvite() {
    setActionError(null);
    const res = await requestInvite();
    if (!res.ok) {
      setActionError(res.error);
      return;
    }
    setInviteUrl(`${location.origin}/room/${code}?invite=${res.token}`);
    setCopied(null);
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

  const me = room.members.find((m) => m.id === you);
  const isHost = !!me?.isHost;
  const isPrivate = room.visibility === "private";
  const readyRacers = room.members.filter(
    (m) => m.role === "racer" && m.connected,
  ).length;
  const teams = room.settings.teams;
  const teamSizes = [0, 1].map(
    (team) =>
      room.members.filter((m) => m.role === "racer" && m.connected && m.team === team).length,
  );
  const emptyTeam = teams && teamSizes.includes(0);
  const canStart = room.settings.bots
    ? readyRacers >= 1
    : readyRacers >= room.minRacers && !emptyTeam;
  const botsJoin = botPlan([teamSizes[0], teamSizes[1]], room.settings).length;
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
            heatmapT={heatmapT}
            noteNames={noteNames}
            onAgain={() => act("race:again")}
            onClose={() => act("room:close")}
          />
        ) : (
          <RaceScreen
            status={room.status}
            race={room.race}
            you={you}
            offset={offset}
            members={room.members}
            isHost={isHost}
            t={t}
            onCancel={() => act("race:cancel")}
            onForfeit={() => act("race:forfeit")}
            onKick={(id) => run(requestKick(id))}
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
      {!isPrivate && (
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => copy("code")} className={secondaryButton}>
            {copied === "code" ? t.copied : t.copyCode}
          </button>
          <button type="button" onClick={() => copy("link")} className={secondaryButton}>
            {copied === "link" ? t.copied : t.copyLink}
          </button>
        </div>
      )}

      <section className="mt-10 max-w-xl" aria-labelledby="visibility-title">
        <h2
          id="visibility-title"
          className="font-mono text-xs uppercase tracking-[0.3em] text-muted"
        >
          {t.visibilityTitle}
        </h2>
        {isHost ? (
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-labelledby="visibility-title">
            {VISIBILITIES.map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={room.visibility === v}
                onClick={() => run(requestVisibility(v))}
                className={
                  room.visibility === v
                    ? "rounded-full border border-teal bg-teal/15 px-4 py-1.5 text-sm font-medium text-ink"
                    : "rounded-full border border-line px-4 py-1.5 text-sm text-muted transition-colors hover:border-teal hover:text-ink"
                }
              >
                {t.visibilities[v]}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-2 font-display text-xl">{t.visibilities[room.visibility]}</p>
        )}
        <p className="mt-2 text-sm text-muted">{t.visibilityHints[room.visibility]}</p>

        {isHost && isPrivate && (
          <div className="mt-5">
            <button type="button" onClick={newInvite} className={secondaryButton}>
              {t.newInvite}
            </button>
            {inviteUrl && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  readOnly
                  value={inviteUrl}
                  aria-label={t.newInvite}
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-lg border border-line bg-bg/70 px-3 py-2 font-mono text-xs text-ink"
                />
                <button type="button" onClick={() => copy("invite")} className={smallButton}>
                  {copied === "invite" ? t.copied : t.copyInvite}
                </button>
              </div>
            )}
            <p className="mt-2 text-sm text-muted">{t.inviteHint}</p>
          </div>
        )}
      </section>

      <RaceSettingsPanel
        settings={room.settings}
        editable={isHost}
        t={t.settings}
        onChange={(patch) => run(requestConfigure(patch))}
      />

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
              className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3"
            >
              <span
                className={`flex min-w-0 flex-1 items-center gap-3 ${m.connected ? "" : "opacity-50"}`}
              >
                <NoteIcon note={m.note} className="text-teal" label={noteNames[m.note]} />
                <span className="min-w-0 truncate font-medium">{m.name}</span>
                {teams && <Tag>{t.teamNames[m.team]}</Tag>}
                {m.isHost && <Tag>{t.host}</Tag>}
                {m.id === you && <Tag>{t.you}</Tag>}
                {m.role === "spectator" && <Tag>{t.spectator}</Tag>}
                {m.watchRequested && <Tag>{t.wantsToWatch}</Tag>}
                {!m.connected && <Tag>{t.reconnecting}</Tag>}
              </span>
              {isHost && teams && m.id === you && (
                <button
                  type="button"
                  onClick={() => run(requestTeam(m.id, m.team === 0 ? 1 : 0))}
                  className={smallButton}
                >
                  {t.switchTeam}
                </button>
              )}
              {isHost && m.id !== you && (
                <span className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
                  {teams && (
                    <button
                      type="button"
                      onClick={() => run(requestTeam(m.id, m.team === 0 ? 1 : 0))}
                      className={smallButton}
                    >
                      {t.switchTeam}
                    </button>
                  )}
                  {m.watchRequested && (
                    <>
                      <button
                        type="button"
                        onClick={() => run(requestAnswerWatch(m.id, true))}
                        className={smallButton}
                      >
                        {t.approve}
                      </button>
                      <button
                        type="button"
                        onClick={() => run(requestAnswerWatch(m.id, false))}
                        className={smallButton}
                      >
                        {t.decline}
                      </button>
                    </>
                  )}
                  {!m.isGuest && (
                    <button
                      type="button"
                      onClick={() => run(requestPromote(m.id))}
                      className={smallButton}
                    >
                      {t.makeHost}
                    </button>
                  )}
                  <KickButton name={m.name} t={t} onKick={() => run(requestKick(m.id))} />
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 max-w-xl text-muted">
        {isPrivate ? t.waitingInvite : t.waiting}
      </p>

      {me && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {me.role === "spectator" ? (
            <>
              <p className="text-sm text-muted">{t.youWatch}</p>
              <button type="button" onClick={() => run(requestWatch(false))} className={smallButton}>
                {t.raceInstead}
              </button>
            </>
          ) : me.watchRequested ? (
            <>
              <p role="status" className="text-sm text-muted">{t.watchPending}</p>
              <button type="button" onClick={() => run(requestWatch(false))} className={smallButton}>
                {t.cancelRequest}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => run(requestWatch(true))} className={smallButton}>
              {isHost ? t.watchInstead : t.askToWatch}
            </button>
          )}
        </div>
      )}

      {isHost ? (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => act("race:start")}
            disabled={!canStart}
            className={primaryButton}
          >
            {t.start}
          </button>
          {!canStart && (
            <p className="mt-3 text-sm text-muted">
              {room.settings.bots
                ? t.needOneRacer
                : readyRacers < room.minRacers
                  ? t.needPlayers.replace("{n}", String(room.minRacers))
                  : t.errors.empty_team}
            </p>
          )}
          {botsJoin && (
            <p className="mt-3 text-sm text-muted">
              {teams && teamSizes[0] !== teamSizes[1]
                ? t.botsEvenTeams
                : botsJoin === 1
                  ? t.botsWillJoin
                  : t.botsWillJoinMany.replace("{n}", String(botsJoin))}
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
