import { headers } from "next/headers";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import Header from "@/components/Header";
import { kicker, panel, primaryButton } from "@/components/ui";
import { getLeaderboard } from "@/db/leaderboard";
import { getDict, getLocale } from "@/i18n";
import { auth } from "@/lib/auth";
import { leaderboardSortSchema } from "@/lib/schemas";

export async function generateMetadata() {
  return { title: `${(await getDict()).leaderboard.title} | JamTyper` };
}

const SORTS = ["wpm", "wins"] as const;

export default async function LeaderboardPage(props: PageProps<"/leaderboard">) {
  const by = leaderboardSortSchema.parse((await props.searchParams).by);
  const [dict, locale, session, rows] = await Promise.all([
    getDict(),
    getLocale(),
    auth.api.getSession({ headers: await headers() }),
    getLeaderboard(by),
  ]);
  const t = dict.leaderboard;
  const number = new Intl.NumberFormat(locale);
  const percent = new Intl.NumberFormat(locale, { style: "percent" });
  const me = session?.user.id;

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 pt-8 sm:px-8 sm:pt-14">
        <p className={kicker}>{t.kicker}</p>
        <h1 className="mt-4 font-display text-4xl sm:text-6xl">{t.title}</h1>
        <span aria-hidden="true" className="ribbon mt-5" />

        <nav aria-label={t.sortLabel} className="mt-6 flex flex-wrap gap-2">
          {SORTS.map((s) => (
            <Link
              key={s}
              href={s === "wpm" ? "/leaderboard" : `/leaderboard?by=${s}`}
              aria-current={by === s ? "page" : undefined}
              className={
                by === s
                  ? "rounded-full border border-teal bg-teal/15 px-4 py-1.5 text-sm font-medium text-ink"
                  : "rounded-full border border-line px-4 py-1.5 text-sm text-muted transition-colors hover:border-teal hover:text-ink"
              }
            >
              {t.sorts[s]}
            </Link>
          ))}
        </nav>

        {rows.length === 0 ? (
          <div className="mt-8">
            <p className="text-muted">{t.empty}</p>
            <Link href="/" className={`mt-6 inline-block ${primaryButton}`}>
              {t.startRace}
            </Link>
          </div>
        ) : (
          <div className={`mt-6 overflow-x-auto p-2 sm:p-3 ${panel}`}>
            <table className="soft-table w-full text-left text-sm">
              <caption className="sr-only">
                {t.title}: {t.sorts[by]}
              </caption>
              <thead className="font-mono text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th scope="col" className="w-12 py-2 pr-4 font-normal">{t.rank}</th>
                  <th scope="col" className="py-2 pr-4 font-normal">{t.player}</th>
                  <th scope="col" className={`py-2 pr-4 text-right font-normal ${by === "wpm" ? "text-teal" : ""}`}>
                    {t.bestWpm}
                  </th>
                  <th scope="col" className={`py-2 pr-4 text-right font-normal ${by === "wins" ? "text-teal" : ""}`}>
                    {t.wins}
                  </th>
                  <th scope="col" className="py-2 pr-4 text-right font-normal">{t.races}</th>
                  <th scope="col" className="py-2 text-right font-normal">{t.accuracy}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} aria-current={r.id === me ? "true" : undefined} className={r.id === me ? "!bg-teal/15" : ""}>
                    <td className={`py-3 pr-4 font-mono ${i < 3 ? "text-teal" : "text-muted"}`}>{i + 1}</td>
                    <td className="py-3 pr-4">
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar name={r.name} image={r.image} size={28} alt="" />
                        <span className="truncate font-medium">{r.name}</span>
                        {r.id === me && <span className="text-muted">({t.you})</span>}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right font-mono">
                      {r.bestWpm === null ? "—" : number.format(Math.round(r.bestWpm))}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono">{number.format(r.wins)}</td>
                    <td className="py-3 pr-4 text-right font-mono">{number.format(r.races)}</td>
                    <td className="py-3 text-right font-mono">
                      {r.accuracy === null ? "—" : percent.format(r.accuracy)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
