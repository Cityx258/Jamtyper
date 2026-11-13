"use client";

import { useEffect, useState } from "react";
import KickButton from "@/components/KickButton";
import StaffLane from "@/components/StaffLane";
import TypingBox from "@/components/TypingBox";
import { secondaryButton } from "@/components/ui";
import type { Dict } from "@/i18n/en";
import type { MemberView, RaceView, RoomStatus } from "@/lib/room-protocol";
import { sendProgress } from "@/lib/socket";
import { countdownCue } from "@/lib/sound";
import { useCue } from "@/lib/use-cue";
import { useFinishNotes } from "@/lib/use-finish-notes";

type Props = {
  status: RoomStatus;
  race: RaceView;
  you: string | null;
  offset: number;
  members: MemberView[];
  isHost: boolean;
  t: Dict["room"];
  onCancel: () => void;
  onForfeit: () => void;
  onKick: (memberId: string) => void;
};

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function RaceScreen({
  status,
  race,
  you,
  offset,
  members,
  isHost,
  t,
  onCancel,
  onForfeit,
  onKick,
}: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const serverNow = now + offset;
  const secondsTo = (ts: number) =>
    Math.max(0, Math.ceil((ts - serverNow) / 1000));
  const me = race.racers.find((r) => r.id === you);
  const myBoost =
    me?.boost && me.boost.until > serverNow ? me.boost.kind : null;
  useCue(status === "countdown" ? secondsTo(race.startsAt) : 0, countdownCue);
  useCue(me?.outcome, (o) => (o === "eliminated" ? "out" : null));
  useFinishNotes(race.racers);
  const offline = new Set(members.filter((m) => !m.connected).map((m) => m.id));

  if (status === "countdown") {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal">
          {t.getReady}
        </p>
        <p className="mt-6 font-display text-8xl" aria-live="polite">
          {secondsTo(race.startsAt)}
        </p>
        {isHost && (
          <button type="button" onClick={onCancel} className={`mt-10 ${secondaryButton}`}>
            {t.cancel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <p className="font-mono text-sm text-muted">
          {race.closesAt ? t.closesIn : t.timeLeft}{" "}
          <span className="text-ink">
            {clock(secondsTo(race.closesAt ?? race.endsAt))}
          </span>
        </p>
        {race.timeGoalSec > 0 && (
          <p className="font-mono text-sm text-muted">
            {t.goal}{" "}
            <span className="text-ink">{clock(race.timeGoalSec)}</span>
          </p>
        )}
        {race.instantDeath && (
          <p className="font-mono text-xs uppercase tracking-wider text-danger">
            {t.instantDeathOn}
          </p>
        )}
        {me?.outcome === "racing" && (
          <button type="button" onClick={onForfeit} className={secondaryButton}>
            {t.forfeit}
          </button>
        )}
      </div>

      <p
        role="status"
        className={`mt-6 h-6 text-sm text-teal transition-opacity ${
          myBoost ? "opacity-100" : "opacity-0"
        }`}
      >
        {myBoost ? t.boostYou[myBoost] : ""}
      </p>

      <div className="mt-2">
        {me?.outcome === "racing" && race.text ? (
          <TypingBox
            key={race.startsAt}
            text={race.text}
            start={me.progress}
            startErrors={me.errors}
            jump={me.jump}
            fogged={myBoost === "spotlight"}
            mode={race.errorMode}
            label={t.typeHere}
            onProgress={sendProgress}
          />
        ) : (
          <>
            <p className="select-none font-mono text-xl leading-relaxed text-muted">
              {race.text}
            </p>
            <p role="status" className="mt-6 text-teal">
              {!me
                ? t.spectating
                : me.outcome === "finished"
                  ? t.finishedMsg
                  : me.outcome === "eliminated"
                    ? t.eliminatedMsg
                    : t.forfeitedMsg}
            </p>
          </>
        )}
        {race.by && (
          <p className="mt-4 text-sm text-muted">{t.quoteBy.replace("{by}", race.by)}</p>
        )}
      </div>

      <ul className="mt-12 space-y-2">
        {race.racers.map((r) => (
          <li key={r.id}>
            <div className="flex items-baseline gap-3 text-sm">
              <span className="w-6 font-mono text-muted">{r.place ?? ""}</span>
              <span className="min-w-0 flex-1 truncate font-medium">
                {r.name}
                {r.id === you && <span className="text-muted"> ({t.you})</span>}
                {r.isBot && <span className="text-muted"> ({t.bot})</span>}
              </span>
              {r.team !== null && (
                <span className="font-mono text-xs uppercase tracking-wider text-muted">
                  {t.teamNames[r.team]}
                </span>
              )}
              {r.boost && r.boost.until > serverNow && (
                <span className="rounded-full border border-teal px-2 font-mono text-[10px] uppercase tracking-wider text-teal">
                  {t.boostTags[r.boost.kind]}
                </span>
              )}
              {r.outcome === "racing" && offline.has(r.id) && (
                <span className="font-mono text-xs uppercase text-muted">
                  {t.reconnecting}
                </span>
              )}
              {r.outcome !== "racing" && (
                <span className="font-mono text-xs uppercase text-muted">
                  {t.outcomes[r.outcome]}
                </span>
              )}
              {isHost && !r.isBot && r.id !== you && r.outcome === "racing" && (
                <KickButton name={r.name} t={t} onKick={() => onKick(r.id)} />
              )}
              <span className="w-20 text-right font-mono">
                {r.wpm} {t.wpm}
              </span>
            </div>
            <StaffLane
              progress={r.progress}
              length={race.length}
              note={r.note}
              pitch={r.pitch}
              tone={
                r.outcome === "racing" || r.outcome === "finished"
                  ? r.id === you
                    ? "you"
                    : "other"
                  : "out"
              }
              label={r.name}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
