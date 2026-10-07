"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

type Mode = "signin" | "signup";

// Better Auth identifies accounts by email. The spec only asks for a username,
// so sign-ups get an internal address on a reserved (undeliverable) domain.
const internalEmail = (username: string) =>
  `${username.toLowerCase()}@users.invalid`;

const USERNAME_RE = /^[a-zA-Z0-9_.]{3,20}$/;

const field =
  "w-full rounded-lg border border-line bg-bg/70 px-4 py-3 text-ink placeholder:text-muted/60 focus:border-teal focus:outline-none";

function ProviderButton({ name }: { name: string }) {
  return (
    <button
      type="button"
      disabled
      className="flex w-full items-center justify-between rounded-lg border border-line px-4 py-3 text-left font-medium text-ink/80 disabled:cursor-not-allowed"
    >
      <span>Continue with {name}</span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
        Soon
      </span>
    </button>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [showPasswordSignup, setShowPasswordSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const showForm = mode === "signin" || showPasswordSignup;

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const username = String(data.get("username") ?? "").trim();
    const password = String(data.get("password") ?? "");

    if (mode === "signup" && !USERNAME_RE.test(username)) {
      setError("Username must be 3-20 characters: letters, numbers, _ or .");
      return;
    }

    setPending(true);
    const res =
      mode === "signin"
        ? await authClient.signIn.username({ username, password })
        : await authClient.signUp.email({
            email: internalEmail(username),
            password,
            name: username,
            username,
          });
    setPending(false);

    if (res.error) {
      setError(
        mode === "signin"
          ? "Wrong username or password."
          : (res.error.message ?? "Could not create the account."),
      );
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <div
        role="tablist"
        aria-label="Sign in or create an account"
        className="mb-8 flex gap-6 border-b border-line"
      >
        {(
          [
            ["signin", "Sign in"],
            ["signup", "Create account"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => switchMode(id)}
            className={`-mb-px border-b-2 pb-3 font-display text-lg transition-colors ${
              mode === id
                ? "border-teal text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <ProviderButton name="Discord" />
        <ProviderButton name="GitHub" />
      </div>

      {mode === "signup" && !showPasswordSignup && (
        <p className="mt-6 text-sm text-muted">
          Discord and GitHub are the quickest and safest way in.{" "}
          <button
            type="button"
            onClick={() => setShowPasswordSignup(true)}
            className="text-teal underline underline-offset-4 hover:text-teal-bright"
          >
            Use a username and password instead
          </button>
        </p>
      )}

      {showForm && (
        <>
          <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-[0.25em] text-muted">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <label className="block">
              <span className="mb-1.5 block text-sm text-muted">Username</span>
              <input
                name="username"
                autoComplete="username"
                required
                className={field}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-muted">Password</span>
              <input
                name="password"
                type="password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                minLength={8}
                required
                className={field}
              />
              {mode === "signup" && (
                <span className="mt-1.5 block text-xs text-muted">
                  At least 8 characters.
                </span>
              )}
            </label>

            {error && (
              <p role="alert" className="text-sm text-[#ff8f8f]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full bg-teal px-6 py-3 font-bold text-bg transition-colors hover:bg-teal-bright disabled:opacity-60"
            >
              {pending
                ? "One moment..."
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
