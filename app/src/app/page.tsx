import { headers } from "next/headers";
import Link from "next/link";
import Clef from "@/components/Clef";
import CreateRoomButton from "@/components/CreateRoomButton";
import Header from "@/components/Header";
import JoinRoomForm from "@/components/JoinRoomForm";
import QuickplayButton from "@/components/QuickplayButton";
import { kicker, panel, primaryButton } from "@/components/ui";
import { getDict } from "@/i18n";
import { auth } from "@/lib/auth";
import { mikuDay } from "@/lib/miku";

export default async function Home() {
  const [dict, session] = await Promise.all([
    getDict(),
    headers().then((h) => auth.api.getSession({ headers: h })),
  ]);
  const t = dict.home;
  const today = mikuDay(new Date());
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 sm:px-8">
        {today && (
          <p
            role="status"
            className="mt-4 self-start rounded-full border border-teal bg-teal/10 px-5 py-2 text-sm font-medium text-ink"
          >
            <span aria-hidden="true" className="mr-2 text-teal">♪</span>
            {t[today]}
          </p>
        )}
        <section className="pt-10 sm:pt-16">
          <div className="relative max-[479px]:[--staff-gap:11px]">
            <div className="staff absolute inset-x-0 top-[calc(var(--staff-gap)*1.5)]" />
            <div className="relative flex items-start gap-3 min-[480px]:gap-4 sm:gap-8">
              <Clef className="-mt-[calc(var(--staff-gap)*1.7)] shrink-0" />
              <div className="pt-1">
                <p className={kicker}>{t.kicker}</p>
                <h1 className="mt-3 max-w-2xl font-display text-[2rem] leading-[1.08] min-[400px]:text-4xl sm:text-6xl">
                  {t.headingA}
                  <br />
                  <span className="text-teal">{t.headingB}</span>
                </h1>
              </div>
            </div>
          </div>
          <p className="mt-10 max-w-xl text-lg text-muted">
            {t.intro}
          </p>
        </section>

        <section
          aria-label={t.waysToPlay}
          className="mt-16 grid gap-5 md:grid-cols-3 md:grid-rows-[auto_1fr_auto_auto]"
        >
          {t.measures.map((m, i) => (
            <div
              key={m.title}
              className={`flex flex-col gap-4 p-7 md:row-span-4 md:grid md:grid-rows-subgrid ${panel}`}
            >
              <h2 className="font-display text-2xl">{m.title}</h2>
              <p className="flex-1 text-muted">{m.text}</p>
              {i === 0 && (
                <QuickplayButton
                  signedIn={!!session}
                  label={m.action}
                  t={t.quickplay}
                  otherRoomT={dict.room.otherRoom}
                />
              )}
              {i === 0 && (
                <div className="flex flex-col items-start gap-4">
                  <CreateRoomButton
                    signedIn={!!session}
                    t={t.create}
                    otherRoomT={dict.room.otherRoom}
                  />
                  <Link href="/rooms" className="text-sm text-teal underline underline-offset-4 hover:text-teal-bright">
                    {t.quickplay.browse}
                  </Link>
                </div>
              )}
              {i === 1 && <JoinRoomForm action={m.action} t={t.join} />}
              {i === 2 && (
                <Link href="/practice" className={`self-start justify-self-start ${primaryButton}`}>
                  {m.action}
                </Link>
              )}
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
