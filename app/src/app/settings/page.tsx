import { headers } from "next/headers";
import Link from "next/link";
import Header from "@/components/Header";
import ProfileForm from "@/components/ProfileForm";
import SoundSettings from "@/components/SoundSettings";
import DeleteAccount from "@/components/DeleteAccount";
import { setLocale, setTheme } from "@/app/actions";
import SignInMethods from "@/components/SignInMethods";
import { getDict, getLocale, getTheme } from "@/i18n";
import { auth, enabledProviders } from "@/lib/auth";
import { methodViews } from "@/lib/sign-in-methods";
import { kicker, panel } from "@/components/ui";
import SlidingChoice from "@/components/SlidingChoice";

export async function generateMetadata() {
  return { title: `${(await getDict()).settings.title} | JamTyper` };
}

export default async function SettingsPage(props: PageProps<"/settings">) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });

  const [dict, accounts, { error }, locale, theme] = await Promise.all([
    getDict(),
    session ? auth.api.listUserAccounts({ headers: h }) : Promise.resolve([]),
    props.searchParams,
    getLocale(),
    getTheme(),
  ]);
  const t = dict.settings;
  const methods = methodViews(accounts, enabledProviders);
  const username = session?.user.username
    ? (session.user.displayUsername ?? session.user.username)
    : null;
  const choice = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
      active ? "text-on-teal" : "text-muted hover:text-ink"
    }`;

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 pt-8 sm:px-8 sm:pt-14">
        <p className={kicker}>
          {session ? t.kicker : t.kickerGuest}
        </p>
        <div className="relative mt-4">
          <h1 className="relative font-display text-4xl sm:text-7xl">{t.title}</h1>
        </div>
        <span aria-hidden="true" className="ribbon mt-5" />
        {session && (
          <Link
            href="/profile"
            className="mt-6 self-start text-sm text-teal underline underline-offset-4 hover:text-teal-bright"
          >
            {t.backToProfile}
          </Link>
        )}

        <section className="mt-12" aria-labelledby="sound-title">
          <h2 id="sound-title" className="font-display text-3xl">
            {t.sound.title}
          </h2>
          <div className="mt-6">
            <SoundSettings t={t.sound} />
          </div>
        </section>

        <section className="mt-16" aria-labelledby="display-title">
          <h2 id="display-title" className="font-display text-3xl">
            {t.display.title}
          </h2>
          <div className={`mt-6 max-w-3xl divide-y divide-line px-5 sm:px-7 ${panel}`}>
            <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-medium text-ink">{t.display.theme}</p>
              <SlidingChoice role="group" aria-label={t.display.theme} indicator="rounded-full bg-teal" className="flex gap-1 self-start rounded-full border border-line p-1">
                {(["system", "light", "dark"] as const).map((value) => (
                  <form key={value} action={setTheme.bind(null, value)}>
                    <button type="submit" aria-pressed={theme === value} className={choice(theme === value)}>
                      {dict.header.themes[value]}
                    </button>
                  </form>
                ))}
              </SlidingChoice>
            </div>
            <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-medium text-ink">{t.display.language}</p>
              <SlidingChoice role="group" aria-label={t.display.language} indicator="rounded-full bg-teal" className="flex gap-1 self-start rounded-full border border-line p-1">
                {(["en", "fr"] as const).map((value) => (
                  <form key={value} action={setLocale.bind(null, value)}>
                    <button type="submit" lang={value} aria-pressed={locale === value} className={choice(locale === value)}>
                      {t.display.languages[value]}
                    </button>
                  </form>
                ))}
              </SlidingChoice>
            </div>
          </div>
        </section>

        {!session && (
          <p className="mt-16 max-w-xl text-muted">
            {t.guestHint}{" "}
            <Link href="/login" className="text-teal underline underline-offset-4 hover:text-teal-bright">
              {dict.header.signIn}
            </Link>
          </p>
        )}

        {session && (
          <>
            <section className="mt-16" aria-labelledby="profile-title">
              <h2 id="profile-title" className="font-display text-3xl">
                {t.profile.title}
              </h2>
              <div className="mt-6">
                <ProfileForm
                  name={session.user.displayUsername ?? session.user.name}
                  image={session.user.image ?? null}
                  t={t.profile}
                />
              </div>
            </section>

            <section className="mt-16" aria-labelledby="methods-title">
              <h2 id="methods-title" className="font-display text-3xl">
                {t.methodsTitle}
              </h2>
              <p className="mt-2 max-w-xl text-muted">{t.methodsHint}</p>
              <div className="mt-6">
                <SignInMethods
                  methods={methods}
                  username={username}
                  linkError={error === "link"}
                  t={t}
                  recoveryT={dict.login.recovery}
                />
              </div>
            </section>

            <section className="mt-16" aria-labelledby="delete-title">
              <h2 id="delete-title" className="font-display text-3xl text-danger">
                {t.deleteAccount.title}
              </h2>
              <p className="mt-2 max-w-xl text-muted">{t.deleteAccount.hint}</p>
              <div className="mt-6">
                <DeleteAccount t={t.deleteAccount} />
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
