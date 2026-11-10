"use client";

import { primaryButton, secondaryButton } from "@/components/ui";
import type { Dict } from "@/i18n/en";
import type { RaceView } from "@/lib/room-protocol";

type Props = {
  race: RaceView;
  you: string | null;
  isHost: boolean;
  t: Dict["room"];
  onAgain: () => void;
  onClose: () => void;
};

export default function RaceResults({ race, you, isHost, t, onAgain, onClose }: Props) {
  return (
    <div className="w-full">
      <h1 className="font-display text-4xl">{t.results}</h1>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="font-mono text-xs uppercase tracking-wider text-muted">
            <tr className="border-b border-line">
              <th className="py-2 pr-4 font-normal">{t.place}</th>
              <th className="py-2 pr-4 font-normal">{t.player}</th>
              <th className="py-2 pr-4 text-right font-normal">{t.wpm}</th>
              <th className="py-2 pr-4 text-right font-normal">{t.accuracy}</th>
              <th className="py-2 font-normal" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {race.racers.map((r) => (
              <tr key={r.id} className={r.id === you ? "text-teal" : ""}>
                <td className="py-3 pr-4 font-mono">{r.place}</td>
                <td className="py-3 pr-4 font-medium">{r.name}</td>
                <td className="py-3 pr-4 text-right font-mono">{r.wpm}</td>
                <td className="py-3 pr-4 text-right font-mono">
                  {Math.round(r.accuracy * 100)}%
                </td>
                <td className="py-3 font-mono text-xs uppercase text-muted">
                  {t.outcomes[r.outcome]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
