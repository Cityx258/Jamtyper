import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import KeyHeatmap from "@/components/KeyHeatmap";
import NotePicker from "@/components/NotePicker";
import RecoveryCodeSection from "@/components/RecoveryCodeSection";
import SignOutButton from "@/components/SignOutButton";
import { primaryButton, secondaryButton } from "@/components/ui";
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
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal">
          {t.kicker}
        </p>
        <div className="relative mt-4">
          <div className="staff absolute inset-x-0 top-[calc(var(--staff-gap)*0.5)]" />
          <h1 className="relative break-all font-display text-4xl sm:text-7xl">
            {name}
          </h1>
        </div>
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
          className="mt-12 grid grid-cols-2 border-y border-line sm:grid-cols-5"
        >
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col gap-2 py-6 sm:px-6 ${
                i > 0 ? "sm:border-l sm:border-line" : "sm:pl-0"
              } ${i % 2 === 1 ? "border-l border-line pl-5" : ""} ${
                i >= 2 ? "border-t border-line sm:border-t-0" : ""
              }`}
            >
              <span className="font-mono text-xs uppercase tracking-wider text-muted">
                {s.label}
              </span>
              <span className="font-display text-4xl text-ink">{s.value}</span>
            </div>
          ))}
        </section>

        <section className="mt-16">
          <h2 className="font-display text-3xl">{t.heatmapTitle}</h2>
          <p className="mt-2 max-w-xl text-muted">{t.heatmapHint}</p>
          <div className="mt-6 max-w-2xl">
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
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="font-mono text-xs uppercase tracking-wider text-muted">
                  <tr className="border-b border-line">
                    <th className="py-2 pr-4 font-normal">{t.date}</th>
                    <th className="py-2 pr-4 font-normal">{t.place}</th>
                    <th className="py-2 pr-4 text-right font-normal">{t.wpm}</th>
                    <th className="py-2 pr-4 text-right font-normal">{t.accuracy}</th>
                    <th className="py-2 font-normal">{t.outcome}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {profile.recent.map((r) => (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap py-3 pr-4 text-muted">
                        {dateTime.format(r.startedAt)}
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
        </section>

        <NotePicker wins={profile.wins} current={noteFor(profile.wins, chosen)} t={t.notes} />

        {withPassword && <RecoveryCodeSection t={dict.login.recovery} />}
      </main>
    </>
  );
}
