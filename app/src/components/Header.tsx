import { headers } from "next/headers";
import Link from "next/link";
import { setLocale, setTheme } from "@/app/actions";
import Avatar from "@/components/Avatar";
import MusicToggle from "@/components/MusicToggle";
import SoundToggle from "@/components/SoundToggle";
import { getDict, getLocale, getTheme } from "@/i18n";
import { auth } from "@/lib/auth";
import { musicTracks } from "@/lib/tracks";

const iconButton =
  "grid h-9 min-w-9 place-items-center rounded-full border border-line px-2 text-xs font-bold text-muted transition-colors hover:border-teal hover:text-ink";

export default async function Header() {
  const [session, t, locale, theme, tracks] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getDict(),
    getLocale(),
    getTheme(),
    musicTracks(),
  ]);
  const nextLocale = locale === "en" ? "fr" : "en";
  const nextTheme = theme === "system" ? "light" : theme === "light" ? "dark" : "system";

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-8">
      <Link href="/" aria-label="JamTyper" className="group flex shrink-0 items-center gap-2 sm:gap-3">
        <span
          aria-hidden="true"
          className="h-10 w-8 bg-teal transition-colors group-hover:bg-teal-bright"
          style={{
            maskImage: "url(/logo.svg)",
            maskRepeat: "no-repeat",
            maskPosition: "center",
            maskSize: "contain",
            WebkitMaskImage: "url(/logo.svg)",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            WebkitMaskSize: "contain",
          }}
        />
        <span className="hidden font-display text-lg tracking-wide text-ink group-hover:text-teal-bright min-[400px]:inline sm:text-xl">
          JamTyper
        </span>
      </Link>
      <nav className="flex min-w-0 items-center gap-1.5 text-sm font-medium sm:gap-2">
        <Link
          href="/rooms"
          className="hidden rounded-full px-3 py-2 text-muted transition-colors hover:text-ink md:block"
        >
          {t.header.rooms}
        </Link>
        <Link
          href="/leaderboard"
          className="hidden rounded-full px-3 py-2 text-muted transition-colors hover:text-ink md:block"
        >
          {t.header.leaderboard}
        </Link>
        <form action={setLocale.bind(null, nextLocale)}>
          <button
            type="submit"
            lang={nextLocale}
            aria-label={t.header.switchLanguage}
            className={iconButton}
          >
            {t.header.languageShort}
          </button>
        </form>
        <form action={setTheme.bind(null, nextTheme)}>
          <button
            type="submit"
            aria-label={t.header.themeLabel
              .replace("{current}", t.header.themes[theme])
              .replace("{next}", t.header.themes[nextTheme])}
            title={t.header.themes[theme]}
            className={iconButton}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {theme === "system" ? (
                <>
                  <rect x="3" y="4" width="18" height="12" rx="2" />
                  <path d="M8 20h8M12 16v4" />
                </>
              ) : theme === "light" ? (
                <>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </>
              ) : (
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              )}
            </svg>
          </button>
        </form>
        <MusicToggle
          tracks={tracks}
          className={iconButton}
          onLabel={t.header.musicOn}
          offLabel={t.header.musicOff}
        />
        <SoundToggle
          className={iconButton}
          onLabel={t.header.soundOn}
          offLabel={t.header.soundOff}
        />
        <Link href="/settings" aria-label={t.header.settings} title={t.header.settings} className={iconButton}>
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
        {session ? (
          <>
            <Link
              href="/profile"
              aria-label={t.header.profile}
              className="flex min-w-0 max-w-48 items-center gap-2 rounded-full px-2 py-1 text-ink transition-colors hover:text-teal-bright sm:ml-2 sm:px-3"
            >
              <Avatar
                name={session.user.displayUsername ?? session.user.name}
                image={session.user.image ?? null}
                size={28}
                alt=""
              />
              <span className="hidden truncate min-[480px]:inline">
                {session.user.displayUsername ?? session.user.name}
              </span>
            </Link>
          </>
        ) : (
          <Link
            href="/login"
            className="shrink-0 whitespace-nowrap rounded-full border border-teal/50 px-4 py-2 text-teal transition-colors hover:bg-teal hover:text-on-teal sm:ml-2 sm:px-5"
          >
            {t.header.signIn}
          </Link>
        )}
      </nav>
    </header>
  );
}
