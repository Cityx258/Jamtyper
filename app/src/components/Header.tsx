import { headers } from "next/headers";
import Link from "next/link";
import { setLocale, setTheme } from "@/app/actions";
import SignOutButton from "@/components/SignOutButton";
import SoundToggle from "@/components/SoundToggle";
import { getDict, getLocale, getTheme } from "@/i18n";
import { auth } from "@/lib/auth";

const iconButton =
  "grid h-9 min-w-9 place-items-center rounded-full border border-line px-2 text-xs font-bold text-muted transition-colors hover:border-teal hover:text-ink";

export default async function Header() {
  const [session, t, locale, theme] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getDict(),
    getLocale(),
    getTheme(),
  ]);
  const nextLocale = locale === "en" ? "fr" : "en";
  const nextTheme = theme === "dark" ? "light" : "dark";

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
            aria-label={
              theme === "dark" ? t.header.switchToLight : t.header.switchToDark
            }
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
              {theme === "dark" ? (
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
        <SoundToggle
          className={iconButton}
          onLabel={t.header.soundOn}
          offLabel={t.header.soundOff}
        />
        {session ? (
          <>
            <Link
              href="/profile"
              aria-label={t.header.profile}
              className="min-w-0 max-w-40 truncate rounded-full px-2 py-2 text-ink transition-colors hover:text-teal-bright sm:ml-2 sm:px-3"
            >
              {session.user.displayUsername ?? session.user.name}
            </Link>
            <span className="hidden sm:block">
              <SignOutButton label={t.header.signOut} />
            </span>
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
