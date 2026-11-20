import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { kicker, panel, primaryButton, secondaryButton } from "@/components/ui";
import { getHistory } from "@/db/history";
import { getDict, getLocale } from "@/i18n";
import { auth } from "@/lib/auth";
import { historyPageSchema } from "@/lib/schemas";

export async function generateMetadata() {
  return { title: `${(await getDict()).history.title} | JamTyper` };
}

export default async function HistoryPage(props: PageProps<"/history">) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const page = historyPageSchema.parse((await props.searchParams).page);
  const [dict, locale, history] = await Promise.all([
    getDict(),
    getLocale(),
    getHistory(session.user.id, page),
  ]);
  const t = dict.history;
  const p = dict.profile;
  const dateTime = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const number = new Intl.NumberFormat(locale);
  const percent = new Intl.NumberFormat(locale, { style: "percent" });

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 pt-8 sm:px-8 sm:pt-14">
        <p className={kicker}>{t.kicker}</p>
        <h1 className="mt-4 font-display text-4xl sm:text-6xl">{t.title}</h1>
        <span aria-hidden="true" className="ribbon mt-5" />
        <p className="mt-4 text-muted">
          {t.count.replace("{n}", number.format(history.total))}
        </p>

        {history.rows.length === 0 ? (
          <div className="mt-8">
            <p className="text-muted">{p.noRaces}</p>
            <Link href="/" className={`mt-6 inline-block ${primaryButton}`}>
              {p.startRace}
            </Link>
          </div>
        ) : (
          <div className={`mt-8 overflow-x-auto p-2 sm:p-3 ${panel}`}>
            <table className="soft-table w-full text-left text-sm">
              <caption className="sr-only">{t.title}</caption>
              <thead className="font-mono text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th scope="col" className="py-2 pr-4 font-normal">{p.date}</th>
                  <th scope="col" className="py-2 pr-4 font-normal">{p.place}</th>
                  <th scope="col" className="py-2 pr-4 text-right font-normal">{p.wpm}</th>
                  <th scope="col" className="py-2 pr-4 text-right font-normal">{p.accuracy}</th>
                  <th scope="col" className="py-2 font-normal">{p.outcome}</th>
                </tr>
              </thead>
              <tbody>
                {history.rows.map((r) => (
                  <tr key={r.raceId}>
                    <td className="whitespace-nowrap py-3 pr-4">
                      <Link
                        href={`/race/${r.raceId}`}
                        className="text-teal underline-offset-4 hover:underline"
                      >
                        {dateTime.format(r.startedAt)}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 font-mono">
                      <span className={r.position === 1 ? "text-teal" : ""}>{r.position}</span>
                      <span className="text-muted">/{r.racers}</span>
                    </td>
                    <td className="py-3 pr-4 text-right font-mono">
                      {number.format(Math.round(r.wpm))}
                      {r.record && (
                        <span className="ml-2 rounded-full border border-teal px-1.5 text-[10px] uppercase text-teal">
                          {dict.room.recordTag}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono">{percent.format(r.accuracy)}</td>
                    <td className="py-3 font-mono text-xs uppercase text-muted">
                      {p.outcomes[r.outcome]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {history.pages > 1 && (
          <nav aria-label={t.pagination} className="mt-8 flex flex-wrap items-center gap-4">
            {page > 1 ? (
              <Link href={`/history?page=${page - 1}`} className={secondaryButton}>
                {t.previous}
              </Link>
            ) : null}
            <span className="font-mono text-sm text-muted" aria-current="page">
              {t.page
                .replace("{page}", number.format(page))
                .replace("{pages}", number.format(history.pages))}
            </span>
            {page < history.pages ? (
              <Link href={`/history?page=${page + 1}`} className={secondaryButton}>
                {t.next}
              </Link>
            ) : null}
          </nav>
        )}
      </main>
    </>
  );
}
