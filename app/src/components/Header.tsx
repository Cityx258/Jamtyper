import { headers } from "next/headers";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import { auth } from "@/lib/auth";

export default async function Header() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
      <Link href="/" className="group flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full border border-dashed border-teal/70 font-mono text-[10px] uppercase tracking-wider text-teal">
          logo
        </span>
        <span className="font-display text-xl tracking-wide text-ink group-hover:text-teal-bright">
          Name
        </span>
      </Link>
      <nav className="flex items-center gap-2 text-sm font-medium">
        {session ? (
          <>
            <span className="text-ink">
              {session.user.displayUsername ?? session.user.name}
            </span>
            <SignOutButton />
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-full border border-teal/50 px-5 py-2 text-teal transition-colors hover:bg-teal hover:text-bg"
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
