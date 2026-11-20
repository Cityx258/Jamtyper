import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Header from "@/components/Header";
import RaceResults from "@/components/RaceResults";
import { secondaryButton } from "@/components/ui";
import { getArchivedRace } from "@/db/history";
import { getDict, getLocale } from "@/i18n";
import { auth } from "@/lib/auth";

export async function generateMetadata() {
  return { title: `${(await getDict()).history.raceTitle} | JamTyper` };
}

export default async function ArchivedRacePage(props: PageProps<"/race/[id]">) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const [{ id }, dict, locale] = await Promise.all([props.params, getDict(), getLocale()]);
  const archived = await getArchivedRace(id, session.user.id);
  if (!archived) notFound();

  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short" });
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 pt-8 sm:px-8 sm:pt-14">
        <Link href="/history" className={`mb-8 self-start ${secondaryButton}`}>
          {dict.history.back}
        </Link>
        <RaceResults
          race={archived.race}
          you={archived.you}
          isHost={false}
          t={dict.room}
          heatmapT={dict.profile.heatmap}
          noteNames={dict.profile.notes.names}
          title={date.format(archived.race.startsAt)}
        />
      </main>
    </>
  );
}
