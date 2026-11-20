"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { panel, smallButton } from "@/components/ui";
import type { Dict } from "@/i18n/en";
import { DIFFICULTIES, LANGUAGES, type Difficulty, type Language } from "@/lib/race-settings";
import type { RoomStatus, RoomSummary } from "@/lib/room-protocol";
import { getSocket, unwatchExplorer, watchExplorer } from "@/lib/socket";

type Props = {
  t: Dict["explorer"];
  languages: Record<Language, string>;
  difficulties: Record<Difficulty, string>;
};

const select =
  "rounded-full border border-line bg-bg px-4 py-2 text-sm text-ink focus:border-teal focus:outline-none";

const phase = (status: RoomStatus) =>
  status === "lobby" ? "waiting" : status === "results" ? "results" : "racing";

export default function RoomExplorer({ t, languages, difficulties }: Props) {
  const [rooms, setRooms] = useState<RoomSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [language, setLanguage] = useState<Language | "all">("all");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");

  useEffect(() => {
    const socket = getSocket();
    const onList = (list: RoomSummary[]) => setRooms(list);
    const watch = () =>
      watchExplorer().then(
        (list) => {
          setRooms(list);
          setFailed(false);
        },
        () => setFailed(true),
      );
    socket.on("rooms:list", onList);
    socket.on("connect", watch);
    void watch();
    return () => {
      socket.off("rooms:list", onList);
      socket.off("connect", watch);
      unwatchExplorer();
    };
  }, []);

  const shown = (rooms ?? []).filter(
    (r) =>
      (language === "all" || r.language === language) &&
      (difficulty === "all" || r.difficulty === difficulty),
  );

  return (
    <div>
      <div className="mt-8 flex flex-wrap gap-4" role="group" aria-label={t.filters}>
        <label className="flex flex-col gap-1.5 text-sm text-muted">
          {t.language}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language | "all")}
            className={select}
          >
            <option value="all">{t.all}</option>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {languages[l]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-muted">
          {t.complexity}
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty | "all")}
            className={select}
          >
            <option value="all">{t.all}</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {difficulties[d]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-6 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted">
        <span className="h-2 w-2 rounded-full bg-teal motion-safe:animate-pulse" aria-hidden />
        {t.live}
      </p>

      {failed ? (
        <p role="alert" className="mt-6 text-danger">
          {t.error}
        </p>
      ) : rooms === null ? (
        <p className="mt-6 text-muted">{t.loading}</p>
      ) : shown.length === 0 ? (
        <p className="mt-6 text-muted">{rooms.length === 0 ? t.empty : t.emptyFiltered}</p>
      ) : (
        <div className={`mt-4 overflow-x-auto p-2 sm:p-3 ${panel}`}>
          <table className="soft-table w-full text-left text-sm">
            <caption className="sr-only">{t.title}</caption>
            <thead className="font-mono text-xs uppercase tracking-wider text-muted">
              <tr>
                <th scope="col" className="py-2 pr-4 font-normal">{t.room}</th>
                <th scope="col" className="py-2 pr-4 font-normal">{t.host}</th>
                <th scope="col" className="py-2 pr-4 text-right font-normal">{t.players}</th>
                <th scope="col" className="py-2 pr-4 font-normal">{t.language}</th>
                <th scope="col" className="py-2 pr-4 font-normal">{t.complexity}</th>
                <th scope="col" className="py-2 pr-4 font-normal">{t.status}</th>
                <th scope="col" className="py-2 font-normal">
                  <span className="sr-only">{t.join}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const state = phase(r.status);
                const full = r.participants >= r.capacity;
                return (
                  <tr key={r.code}>
                    <td className="py-3 pr-4 font-mono tracking-widest">{r.code}</td>
                    <td className="max-w-40 truncate py-3 pr-4">{r.host}</td>
                    <td className="py-3 pr-4 text-right font-mono">
                      {r.participants}/{r.capacity}
                    </td>
                    <td className="py-3 pr-4">{languages[r.language]}</td>
                    <td className="py-3 pr-4">{difficulties[r.difficulty]}</td>
                    <td className="py-3 pr-4 font-mono text-xs uppercase text-muted">
                      {t.statuses[state]}
                    </td>
                    <td className="py-3 text-right">
                      {state === "racing" ? (
                        <span className="text-xs text-muted">{t.wait}</span>
                      ) : (
                        <Link href={`/room/${r.code}`} className={smallButton}>
                          {full ? t.watch : t.join}
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
