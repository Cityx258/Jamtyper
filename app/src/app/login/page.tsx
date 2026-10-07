import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import Clef from "@/components/Clef";
import Header from "@/components/Header";
import LoginForm from "@/components/LoginForm";
import { auth } from "@/lib/auth";

export const metadata = { title: "Sign in | Name" };

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/");

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-12 px-5 pb-16 pt-8 sm:px-8 md:flex-row md:items-start md:gap-20 md:pt-16">
        <div className="relative hidden shrink-0 md:block md:w-72">
          <div className="staff absolute inset-x-0 top-[calc(var(--staff-gap)*1.5)] -right-8" />
          <Clef className="relative -mt-[calc(var(--staff-gap)*1.7)] block" />
          <p className="relative mt-24 max-w-[16rem] font-display text-3xl leading-tight">
            Welcome <span className="text-teal">back</span> to the stage.
          </p>
        </div>
        <div className="flex w-full flex-col items-center md:items-start">
          <LoginForm />
          <p className="mt-8 text-sm text-muted">
            Just looking around?{" "}
            <Link
              href="/"
              className="text-teal underline underline-offset-4 hover:text-teal-bright"
            >
              Continue as a guest
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
