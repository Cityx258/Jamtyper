import { headers } from "next/headers";
import Clef from "@/components/Clef";
import CreateRoomButton from "@/components/CreateRoomButton";
import Header from "@/components/Header";
import JoinRoomForm from "@/components/JoinRoomForm";
import { primaryButton } from "@/components/ui";
import { getDict } from "@/i18n";
import { auth } from "@/lib/auth";

export default async function Home() {
  const [t, session] = await Promise.all([
    getDict().then((d) => d.home),
    headers().then((h) => auth.api.getSession({ headers: h })),
  ]);
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 sm:px-8">
        <section className="pt-10 sm:pt-16">
          <div className="relative">
            <div className="staff absolute inset-x-0 top-[calc(var(--staff-gap)*1.5)]" />
            <div className="relative flex items-start gap-4 sm:gap-8">
              <Clef className="-mt-[calc(var(--staff-gap)*1.7)] shrink-0" />
              <div className="pt-1">
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal">
                  {t.kicker}
                </p>
                <h1 className="mt-3 max-w-2xl font-display text-4xl leading-[1.08] sm:text-6xl">
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
          className="mt-16 grid border-y border-line md:grid-cols-3"
        >
          {t.measures.map((m, i) => (
            <div
              key={m.title}
              className={`flex flex-col gap-4 px-1 py-8 md:px-8 ${
                i > 0 ? "border-t border-line md:border-l md:border-t-0" : ""
              } ${i === 0 ? "md:pl-0" : ""}`}
            >
              <span className="font-mono text-xs text-teal">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="font-display text-2xl">{m.title}</h2>
              <p className="flex-1 text-muted">{m.text}</p>
              {i === 0 && (
                <CreateRoomButton
                  signedIn={!!session}
                  label={m.action}
                  t={t.create}
                />
              )}
              {i === 1 && <JoinRoomForm action={m.action} t={t.join} />}
              {i === 2 && (
                <button type="button" className={`self-start ${primaryButton}`}>
                  {m.action}
                </button>
              )}
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
