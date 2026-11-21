"use client";

import KeyHeatmap from "@/components/KeyHeatmap";
import NoteIcon from "@/components/NoteIcon";
import Podium from "@/components/Podium";
import RaceGraph from "@/components/RaceGraph";
import RaceMelody from "@/components/RaceMelody";
import { panel, primaryButton, secondaryButton } from "@/components/ui";
import { clearRank, THANK_YOU_WPM } from "@/lib/miku";
import type { Dict } from "@/i18n/en";
import type { RacerView, RaceView } from "@/lib/room-protocol";
import { teamScores, winningTeam } from "@/lib/teams";

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

type Props = {
  race: RaceView;
  you: string | null;
  isHost: boolean;
  t: Dict["room"];
  heatmapT: Dict["profile"]["heatmap"];
  noteNames: Dict["profile"]["notes"]["names"];
  title?: string;
  melodyHeld?: boolean;
  onAgain?: () => void;
  onClose?: () => void;
};

export default function RaceResults({
  race,
  you,
  isHost,
  t,
  heatmapT,
  noteNames,
  title,
  melodyHeld,
  onAgain,
  onClose,
}: Props) {
  const me = race.racers.find((r) => r.id === you);
  const goalMs = race.timeGoalSec * 1000;
  const metGoal = (r: RacerView) => r.timeMs !== null && r.timeMs <= goalMs;
  const goalCount = race.racers.filter(metGoal).length;
  const scores = race.teams ? teamScores(race.racers) : null;
  const winner = scores ? winningTeam(scores) : null;
  const rank = me?.outcome === "finished" ? clearRank(me.accuracy, me.mistakes) : null;
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
        <h1 className="font-display text-4xl">{title ?? t.results}</h1>
        {rank && (
          <p className="font-mono text-sm uppercase tracking-[0.25em] text-muted">
            {t.clearRank}{" "}
            <span className={`font-display text-xl tracking-wider ${rank === "cheap" ? "text-muted" : "text-teal"}`}>
              {t.ranks[rank]}
            </span>
          </p>
        )}
      </div>
      {rank && me?.wpm === THANK_YOU_WPM && (
        <p role="status" className="mt-4 rounded-2xl border border-teal bg-teal/10 px-4 py-3 font-medium text-ink">
          {t.thankYou}
        </p>
      )}
      {me?.record && (
        <p
          role="status"
          className="mt-4 rounded-2xl border border-teal bg-teal/10 px-4 py-3 font-medium text-ink"
        >
          {t.newRecord.replace("{wpm}", String(me.wpm))}
        </p>
      )}
      {me?.unlocked && (
        <p
          role="status"
          className="mt-4 flex items-center gap-3 rounded-2xl border border-teal bg-teal/10 px-4 py-3 text-ink"
        >
          <NoteIcon note={me.unlocked} size={28} className="text-teal" />
          {t.unlockedNote.replace("{note}", noteNames[me.unlocked])}
        </p>
      )}
      <Podium racers={race.racers} you={you} t={t} />
      <RaceMelody racers={race.racers} you={you} raceKey={race.startsAt} held={melodyHeld} t={t.melody} />

      {goalMs > 0 && (
        <p className="mt-3 text-muted">
          {(goalCount === 0 ? t.goalBeatNone : goalCount === 1 ? t.goalBeatOne : t.goalBeat)
            .replace("{n}", String(goalCount))
            .replace("{goal}", `${race.timeGoalSec} s`)}
        </p>
      )}

      {scores && (
        <section className="mt-8" aria-label={t.teamNames.join(" / ")}>
          <p className="font-display text-2xl text-teal">
            {winner === null ? t.teamTie : t.teamWins.replace("{team}", t.teamNames[winner])}
          </p>
          <div className="mt-4 grid max-w-xl grid-cols-2 gap-3">
            {scores.map((s) => (
              <div
                key={s.team}
                className={`rounded-2xl border px-4 py-3 ${
                  s.team === winner ? "border-teal bg-teal/10" : "border-line"
                }`}
              >
                <p className="font-mono text-xs uppercase tracking-wider text-muted">
                  {t.teamNames[s.team]}
                </p>
                <p className="mt-1 font-mono text-lg">
                  {t.teamAverage.replace("{wpm}", String(s.wpm))}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className={`mt-8 overflow-x-auto p-2 sm:p-3 ${panel}`}>
        <table className="soft-table w-full text-left text-sm">
          <thead className="font-mono text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="py-2 pr-3 sm:pr-4 font-normal">{t.place}</th>
              <th className="py-2 pr-3 sm:pr-4 font-normal">{t.player}</th>
              <th className="py-2 pr-3 sm:pr-4 text-right font-normal">{t.wpm}</th>
              <th className="hidden py-2 pr-3 sm:table-cell sm:pr-4 text-right font-normal">{t.rawWpm}</th>
              <th className="py-2 pr-4 text-right font-normal">{t.accuracy}</th>
              <th className="hidden py-2 pr-3 sm:table-cell sm:pr-4 text-right font-normal">{t.errorCount}</th>
              <th className="hidden py-2 pr-3 sm:table-cell sm:pr-4 text-right font-normal">{t.time}</th>
              <th className="hidden py-2 pr-3 sm:table-cell sm:pr-4 font-normal">{t.status}</th>
              <th className="hidden py-2 text-right font-normal sm:table-cell">{t.boostsReceived}</th>
            </tr>
          </thead>
          <tbody>
            {race.racers.map((r) => (
              <tr key={r.id} className={r.id === you ? "text-teal" : ""}>
                <td className="py-3 pr-3 sm:pr-4 font-mono">{r.place}</td>
                <td className="py-3 pr-3 sm:pr-4 font-medium">
                  <NoteIcon note={r.note} size={16} className="mr-2 inline-block align-[-2px] text-teal" />
                  {r.name}
                  {r.isBot && <span className="text-muted"> ({t.bot})</span>}
                  {r.outcome !== "finished" && (
                    <span className="block font-mono text-xs font-normal uppercase text-muted sm:hidden">
                      {t.outcomes[r.outcome]}
                    </span>
                  )}
                  {r.team !== null && (
                    <span className="ml-2 font-mono text-xs uppercase tracking-wider text-muted">
                      {t.teamNames[r.team]}
                    </span>
                  )}
                </td>
                <td className="py-3 pr-3 sm:pr-4 text-right font-mono">
                  {r.wpm}
                  {r.record && (
                    <span className="ml-2 rounded-full border border-teal px-1.5 text-[10px] uppercase text-teal">
                      {t.recordTag}
                    </span>
                  )}
                </td>
                <td className="hidden py-3 pr-3 sm:table-cell sm:pr-4 text-right font-mono text-muted">{r.rawWpm}</td>
                <td className="py-3 pr-4 text-right font-mono max-sm:rounded-r-full">
                  {Math.round(r.accuracy * 100)}%
                </td>
                <td className="hidden py-3 pr-3 sm:table-cell sm:pr-4 text-right font-mono">{r.mistakes}</td>
                <td className="hidden whitespace-nowrap py-3 pr-3 sm:table-cell sm:pr-4 text-right font-mono">
                  {r.timeMs === null ? "-" : seconds(r.timeMs)}
                  {goalMs > 0 && metGoal(r) && (
                    <span className="ml-2 text-teal" title={t.goalMet}>
                      ✓<span className="sr-only"> {t.goalMet}</span>
                    </span>
                  )}
                </td>
                <td className="hidden py-3 pr-3 sm:table-cell sm:pr-4 font-mono text-xs uppercase text-muted">
                  {t.outcomes[r.outcome]}
                </td>
                <td className="hidden py-3 text-right font-mono sm:table-cell">{r.bonuses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RaceGraph racers={race.racers} you={you} t={t.graph} />

      {me && (
        <section className="mt-12 max-w-2xl">
          <h2 className="font-display text-2xl">{t.yourMisses}</h2>
          <div className={`mt-4 p-5 sm:p-7 ${panel}`}>
            <KeyHeatmap missed={me.missed} t={heatmapT} />
          </div>
        </section>
      )}

      {!onAgain || !onClose ? null : isHost ? (
        <div className="mt-10 flex flex-wrap gap-3">
          <button type="button" onClick={onAgain} className={primaryButton}>
            {t.raceAgain}
          </button>
          <button type="button" onClick={onClose} className={secondaryButton}>
            {t.closeRoom}
          </button>
        </div>
      ) : (
        <p className="mt-10 text-muted">{t.waitingAgain}</p>
      )}
    </div>
  );
}
