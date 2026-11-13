import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import SignInMethods from "@/components/SignInMethods";
import { getDict } from "@/i18n";
import { auth, enabledProviders } from "@/lib/auth";
import { methodViews } from "@/lib/sign-in-methods";

export async function generateMetadata() {
  return { title: `${(await getDict()).settings.title} | JamTyper` };
}

export default async function SettingsPage(props: PageProps<"/settings">) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/login");

  const [dict, accounts, { error }] = await Promise.all([
    getDict(),
    auth.api.listUserAccounts({ headers: h }),
    props.searchParams,
  ]);
  const t = dict.settings;
  const methods = methodViews(accounts, enabledProviders);
  const username = session.user.username
    ? (session.user.displayUsername ?? session.user.username)
    : null;

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 pt-8 sm:px-8 sm:pt-14">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal">{t.kicker}</p>
        <div className="relative mt-4">
          <div className="staff absolute inset-x-0 top-[calc(var(--staff-gap)*0.5)]" />
          <h1 className="relative font-display text-4xl sm:text-7xl">{t.title}</h1>
        </div>
        <Link
          href="/profile"
          className="mt-6 self-start text-sm text-teal underline underline-offset-4 hover:text-teal-bright"
        >
          {t.backToProfile}
        </Link>

        <section className="mt-12" aria-labelledby="methods-title">
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
      </main>
    </>
  );
}
