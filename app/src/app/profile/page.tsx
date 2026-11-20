import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import Avatar from "@/components/Avatar";
import Header from "@/components/Header";
import KeyHeatmap from "@/components/KeyHeatmap";
import NotePicker from "@/components/NotePicker";
import ProgressGraph from "@/components/ProgressGraph";
import RecoveryCodeSection from "@/components/RecoveryCodeSection";
import SignOutButton from "@/components/SignOutButton";
import { kicker, panel, primaryButton, secondaryButton, tile } from "@/components/ui";
import { getProfile } from "@/db/profile";
import { getDict, getLocale } from "@/i18n";
import { auth } from "@/lib/auth";
import { hasPassword } from "@/lib/recovery";
import { chosenNote } from "@/db/notes";
import { noteFor } from "@/lib/notes";

export async function generateMetadata() {
  return { title: `${(await getDict()).profile.title} | JamTyper` };
}

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [dict, locale, profile, withPassword, chosen] = await Promise.all([
    getDict(),
    getLocale(),
    getProfile(session.user.id),
    hasPassword(session.user.id),
    chosenNote(session.user.id),
  ]);
  const t = dict.profile;
  const name = session.user.displayUsername ?? session.user.name;
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const dateTime = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const round = (n: number | null) => (n === null ? "–" : String(Math.round(n)));

  const stats = [
    { label: t.races, value: String(profile.races) },
    { label: t.wins, value: String(profile.wins) },
    { label: t.bestWpm, value: round(profile.bestWpm) },
    { label: t.avgWpm, value: round(profile.avgWpm) },
    {
      label: t.accuracy,
      value:
        profile.avgAccuracy === null
          ? "–"
          : `${Math.round(profile.avgAccuracy * 100)}%`,
    },
  ];

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 pt-8 sm:px-8 sm:pt-14">
        <p className={kicker}>
          {t.kicker}
        </p>
        <div className="relative mt-4 flex items-center gap-5">
          <Avatar
            name={name}
            image={session.user.image ?? null}
            size={80}
            alt={dict.settings.profile.photoAlt.replace("{name}", name)}
            className="relative"
          />
          <h1 className="relative break-all font-display text-4xl sm:text-7xl">
            {name}
          </h1>
        </div>
        <span aria-hidden="true" className="ribbon mt-5" />
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="text-muted">
            {t.memberSince.replace("{date}", date.format(session.user.createdAt))}
          </p>
          <Link href="/settings" className={secondaryButton}>
            {t.settings}
          </Link>
          <SignOutButton label={dict.header.signOut} className={secondaryButton} />
        </div>

        <section
          aria-label={t.title}
          className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-5"
        >
          {stats.map((s) => (
            <div key={s.label} className={`flex flex-col gap-2 px-5 py-4 ${tile}`}>
              <span className="font-mono text-xs uppercase tracking-wider text-muted">
                {s.label}
              </span>
              <span className="font-display text-4xl text-ink">{s.value}</span>
            </div>
          ))}
        </section>

        <ProgressGraph points={profile.history} locale={locale} t={t.progress} />

        <section className="mt-16">
          <h2 className="font-display text-3xl">{t.heatmapTitle}</h2>
          <p className="mt-2 max-w-xl text-muted">{t.heatmapHint}</p>
          <div className={`mt-6 max-w-2xl p-5 sm:p-7 ${panel}`}>
            <KeyHeatmap missed={profile.missed} t={t.heatmap} />
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-3xl">{t.recentTitle}</h2>
          {profile.recent.length === 0 ? (
            <div className="mt-6">
              <p className="text-muted">{t.noRaces}</p>
              <Link href="/" className={`mt-6 inline-block ${primaryButton}`}>
                {t.startRace}
              </Link>
            </div>
          ) : (
            <div className={`mt-6 overflow-x-auto p-2 sm:p-3 ${panel}`}>
              <table className="soft-table w-full text-left text-sm">
                <thead className="font-mono text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="py-2 pr-4 font-normal">{t.date}</th>
                    <th className="py-2 pr-4 font-normal">{t.place}</th>
                    <th className="py-2 pr-4 text-right font-normal">{t.wpm}</th>
                    <th className="py-2 pr-4 text-right font-normal">{t.accuracy}</th>
                    <th className="py-2 font-normal">{t.outcome}</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.recent.map((r) => (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap py-3 pr-4">
                        <Link
                          href={`/race/${r.raceId}`}
                          className="text-teal underline-offset-4 hover:underline"
                        >
                          {dateTime.format(r.startedAt)}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 font-mono">
                        <span className={r.position === 1 ? "text-teal" : ""}>
                          {r.position}
                        </span>
                        <span className="text-muted">/{r.racers}</span>
                      </td>
                      <td className="py-3 pr-4 text-right font-mono">
                        {Math.round(r.wpm)}
                      </td>
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
          )}
          {profile.recent.length > 0 && (
            <Link href="/history" className={`mt-6 inline-block ${secondaryButton}`}>
              {dict.history.seeAll}
            </Link>
          )}
        </section>

        <NotePicker wins={profile.wins} current={noteFor(profile.wins, chosen)} t={t.notes} />

        {withPassword && <RecoveryCodeSection t={dict.login.recovery} />}
      </main>
    </>
  );
}
