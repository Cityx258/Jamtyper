import Link from "next/link";
import NowPlaying from "@/components/NowPlaying";
import { getDict } from "@/i18n";

export default async function Footer() {
  const t = (await getDict()).footer;
  const link = "text-muted transition-colors hover:text-ink";
  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <NowPlaying label={t.nowPlaying} by={t.by} />
      </div>
      <footer className="mx-auto w-full max-w-6xl border-t border-line px-5 pb-20 pt-8 text-sm sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted">
            <span className="font-display text-ink">JamTyper</span> · {t.tagline}{" "}
            <abbr title={t.thanks} className="font-mono text-teal no-underline">
              39 ♪
            </abbr>
          </p>
          <nav aria-label={t.nav}>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              <li>
                <Link href="/" className={link}>
                  {t.home}
                </Link>
              </li>
              <li>
                <Link href="/rooms" className={link}>
                  {t.rooms}
                </Link>
              </li>
              <li>
                <Link href="/practice" className={link}>
                  {t.practice}
                </Link>
              </li>
              <li>
                <Link href="/profile" className={link}>
                  {t.profile}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </footer>
    </>
  );
}
