"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Dict } from "@/i18n/en";
import type { Provider } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";

type T = Dict["login"];

type Mode = "signin" | "signup";

const internalEmail = (username: string) =>
  `${username.toLowerCase()}@users.invalid`;

const USERNAME_RE = /^[a-zA-Z0-9_.]{3,20}$/;

const field =
  "w-full rounded-lg border border-line bg-bg/70 px-4 py-3 text-ink placeholder:text-muted/60 focus:border-teal focus:outline-none";

const PROVIDER_NAMES: Record<Provider, string> = {
  discord: "Discord",
  github: "GitHub",
};

function ProviderButton({
  provider,
  enabled,
  busy,
  onClick,
  t,
}: {
  provider: Provider;
  enabled: boolean;
  busy: boolean;
  onClick: () => void;
  t: T;
}) {
  return (
    <button
      type="button"
      disabled={!enabled || busy}
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg border border-line px-4 py-3 text-left font-medium text-ink/80 transition-colors enabled:hover:border-teal enabled:hover:text-ink disabled:cursor-not-allowed"
    >
      <span>{t.continueWith.replace("{name}", PROVIDER_NAMES[provider])}</span>
      {!enabled && (
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
          {t.soon}
        </span>
      )}
    </button>
  );
}

export default function LoginForm({
  t,
  providers,
  oauthError,
}: {
  t: T;
  providers: Provider[];
  oauthError: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [showPasswordSignup, setShowPasswordSignup] = useState(false);
  const [error, setError] = useState<string | null>(
    oauthError ? t.errors.oauth : null,
  );
  const [pending, setPending] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  async function social(provider: Provider) {
    setError(null);
    setRedirecting(true);
    const res = await authClient.signIn.social({
      provider,
      callbackURL: "/",
      errorCallbackURL: "/login?error=oauth",
    });
    if (res.error) {
      setRedirecting(false);
      setError(t.errors.oauth);
    }
  }

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
      setError(t.errors.usernameFormat);
      return;
    }
    if (mode === "signup" && password.length < 8) {
      setError(t.errors.passwordShort);
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
      const code = res.error.code ?? "";
      setError(
        mode === "signin"
          ? t.errors.badCredentials
          : /TAKEN|EXISTS/.test(code)
            ? t.errors.taken
            : t.errors.generic,
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
        aria-label={t.tablistLabel}
        className="mb-8 flex gap-6 border-b border-line"
      >
        {(
          [
            ["signin", t.tabSignIn],
            ["signup", t.tabSignUp],
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
        {(["discord", "github"] as const).map((p) => (
          <ProviderButton
            key={p}
            provider={p}
            enabled={providers.includes(p)}
            busy={redirecting}
            onClick={() => social(p)}
            t={t}
          />
        ))}
      </div>

      {error && !showForm && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}

      {mode === "signup" && !showPasswordSignup && (
        <p className="mt-6 text-sm text-muted">
          {t.nudge}{" "}
          <button
            type="button"
            onClick={() => setShowPasswordSignup(true)}
            className="text-teal underline underline-offset-4 hover:text-teal-bright"
          >
            {t.usePassword}
          </button>
        </p>
      )}

      {showForm && (
        <>
          <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-[0.25em] text-muted">
            <span className="h-px flex-1 bg-line" />
            {t.or}
            <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <label className="block">
              <span className="mb-1.5 block text-sm text-muted">{t.username}</span>
              <input
                name="username"
                autoComplete="username"
                required
                className={field}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-muted">{t.password}</span>
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
                  {t.passwordHint}
                </span>
              )}
            </label>

            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full bg-teal px-6 py-3 font-bold text-on-teal transition-colors hover:bg-teal-bright disabled:opacity-60"
            >
              {pending
                ? t.pending
                : mode === "signin"
                  ? t.submitSignIn
                  : t.submitSignUp}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
