"use client";

import KeyHeatmap from "@/components/KeyHeatmap";
import NoteIcon from "@/components/NoteIcon";
import { primaryButton, secondaryButton } from "@/components/ui";
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
  onAgain: () => void;
  onClose: () => void;
};

export default function RaceResults({
  race,
  you,
  isHost,
  t,
  heatmapT,
  noteNames,
  onAgain,
  onClose,
}: Props) {
  const me = race.racers.find((r) => r.id === you);
  const goalMs = race.timeGoalSec * 1000;
  const metGoal = (r: RacerView) => r.timeMs !== null && r.timeMs <= goalMs;
  const goalCount = race.racers.filter(metGoal).length;
  const scores = race.teams ? teamScores(race.racers) : null;
  const winner = scores ? winningTeam(scores) : null;
  return (
    <div className="w-full">
      <h1 className="font-display text-4xl">{t.results}</h1>
      {me?.unlocked && (
        <p
          role="status"
          className="mt-4 flex items-center gap-3 rounded-lg border border-teal bg-teal/10 px-4 py-3 text-ink"
        >
          <NoteIcon note={me.unlocked} size={28} className="text-teal" />
          {t.unlockedNote.replace("{note}", noteNames[me.unlocked].toLowerCase())}
        </p>
      )}
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
                className={`rounded-lg border px-4 py-3 ${
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

      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="font-mono text-xs uppercase tracking-wider text-muted">
            <tr className="border-b border-line">
              <th className="py-2 pr-3 sm:pr-4 font-normal">{t.place}</th>
              <th className="py-2 pr-3 sm:pr-4 font-normal">{t.player}</th>
              <th className="py-2 pr-3 sm:pr-4 text-right font-normal">{t.wpm}</th>
              <th className="py-2 pr-3 sm:pr-4 text-right font-normal">{t.accuracy}</th>
              <th className="py-2 pr-3 sm:pr-4 text-right font-normal">{t.time}</th>
              <th className="py-2 font-normal" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {race.racers.map((r) => (
              <tr key={r.id} className={r.id === you ? "text-teal" : ""}>
                <td className="py-3 pr-3 sm:pr-4 font-mono">{r.place}</td>
                <td className="py-3 pr-3 sm:pr-4 font-medium">
                  <NoteIcon note={r.note} size={16} className="mr-2 inline-block align-[-2px] text-teal" />
                  {r.name}
                  {r.isBot && <span className="text-muted"> ({t.bot})</span>}
                  {r.team !== null && (
                    <span className="ml-2 font-mono text-xs uppercase tracking-wider text-muted">
                      {t.teamNames[r.team]}
                    </span>
                  )}
                </td>
                <td className="py-3 pr-3 sm:pr-4 text-right font-mono">{r.wpm}</td>
                <td className="py-3 pr-3 sm:pr-4 text-right font-mono">
                  {Math.round(r.accuracy * 100)}%
                </td>
                <td className="whitespace-nowrap py-3 pr-3 sm:pr-4 text-right font-mono">
                  {r.timeMs === null ? "-" : seconds(r.timeMs)}
                  {goalMs > 0 && metGoal(r) && (
                    <span className="ml-2 text-teal" title={t.goalMet}>
                      ✓<span className="sr-only"> {t.goalMet}</span>
                    </span>
                  )}
                </td>
                <td className="py-3 font-mono text-xs uppercase text-muted">
                  {t.outcomes[r.outcome]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {me && (
        <section className="mt-12 max-w-2xl">
          <h2 className="font-display text-2xl">{t.yourMisses}</h2>
          <div className="mt-4">
            <KeyHeatmap missed={me.missed} t={heatmapT} />
          </div>
        </section>
      )}

      {isHost ? (
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
