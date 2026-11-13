import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import { getDict } from "@/i18n";
import { auth } from "@/lib/auth";

export async function generateMetadata() {
  return { title: `${(await getDict()).login.recovery.resetTitle} | JamTyper` };
}

export default async function ResetPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/profile");
  const t = (await getDict()).login.recovery;
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 pt-8 sm:px-8 sm:pt-14">
        <h1 className="font-display text-4xl sm:text-5xl">{t.resetTitle}</h1>
        <p className="mt-4 max-w-xl text-muted">{t.resetIntro}</p>
        <div className="mt-8">
          <ResetPasswordForm t={t} />
        </div>
      </main>
    </>
  );
}
