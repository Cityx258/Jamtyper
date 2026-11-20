import Link from "next/link";
import Header from "@/components/Header";
import { primaryButton, kicker } from "@/components/ui";
import { getDict } from "@/i18n";

export async function generateMetadata() {
  return { title: `${(await getDict()).notFound.title} | JamTyper` };
}

export default async function NotFound() {
  const t = (await getDict()).notFound;
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 pt-8 sm:px-8 sm:pt-14">
        <p className={kicker}>404</p>
        <div className="relative mt-4">
          <h1 className="relative font-display text-5xl sm:text-7xl">{t.heading}</h1>
        </div>
        <span aria-hidden="true" className="ribbon mt-5" />
        <p className="mt-8 max-w-xl text-lg text-muted">{t.text}</p>
        <Link href="/" className={`mt-8 self-start ${primaryButton}`}>
          {t.home}
        </Link>
      </main>
    </>
  );
}
