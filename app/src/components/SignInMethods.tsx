"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addPassword } from "@/app/settings-actions";
import RecoveryCodeNotice from "@/components/RecoveryCodeNotice";
import { primaryButton, secondaryButton, smallButton } from "@/components/ui";
import type { Dict } from "@/i18n/en";
import { authClient } from "@/lib/auth-client";
import type { Method, MethodView } from "@/lib/sign-in-methods";

type Props = {
  methods: MethodView[];
  username: string | null;
  linkError: boolean;
  t: Dict["settings"];
  recoveryT: Dict["login"]["recovery"];
};

const NAMES: Record<Exclude<Method, "credential">, string> = {
  discord: "Discord",
  github: "GitHub",
};

const field =
  "w-full rounded-lg border border-line bg-bg/70 px-4 py-3 text-ink placeholder:text-muted/60 focus:border-teal focus:outline-none";

export default function SignInMethods({ methods, username, linkError, t, recoveryT }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(linkError ? t.errors.link : null);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  async function link(provider: "discord" | "github") {
    setError(null);
    setBusy(true);
    const res = await authClient.linkSocial({
      provider,
      callbackURL: "/settings",
      errorCallbackURL: "/settings?error=link",
    });
    if (res.error) {
      setBusy(false);
      setError(t.errors.link);
    }
  }

  async function unlink(accountId: string) {
    setError(null);
    setBusy(true);
    const res = await authClient.unlinkAccount({ accountId });
    setBusy(false);
    if (!res.error) router.refresh();
    else setError(res.error.code === "SESSION_NOT_FRESH" ? t.errors.fresh : t.errors.unlink);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    setBusy(true);
    const res = await addPassword(data.get("username"), data.get("password")).catch(
      () => ({ ok: false, error: "generic" }) as const,
    );
    setBusy(false);
    if (res.ok) setCode(res.code);
    else setError(t.errors[res.error]);
  }

  if (code) {
    return (
      <RecoveryCodeNotice
        code={code}
        t={recoveryT}
        onDone={() => {
          setCode(null);
          setAdding(false);
          router.refresh();
        }}
      />
    );
  }

  return (
    <div className="max-w-2xl">
      <ul className="divide-y divide-line border-y border-line">
        {methods.map((m) => (
          <li key={m.method} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="min-w-0">
              <p className="font-medium text-ink">
                {m.method === "credential" ? t.password : NAMES[m.method]}
              </p>
              <p className="font-mono text-xs uppercase tracking-wider text-muted">
                {m.accountId
                  ? m.method === "credential" && username
                    ? t.signsInAs.replace("{name}", username)
                    : t.linked
                  : t.notLinked}
              </p>
            </div>
            {m.method === "credential" ? (
              !m.accountId &&
              !adding && (
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  disabled={busy}
                  className={smallButton}
                >
                  {t.add}
                </button>
              )
            ) : !m.available ? (
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                {t.soon}
              </span>
            ) : !m.accountId ? (
              <button
                type="button"
                onClick={() => link(m.method as "discord" | "github")}
                disabled={busy}
                className={smallButton}
              >
                {t.link}
              </button>
            ) : m.canUnlink ? (
              <button
                type="button"
                onClick={() => unlink(m.accountId!)}
                disabled={busy}
                className={smallButton}
              >
                {t.unlink}
              </button>
            ) : (
              <span className="text-xs text-muted">{t.lastMethod}</span>
            )}
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}

      {adding && (
        <form onSubmit={onSubmit} className="mt-8 max-w-md space-y-4" noValidate>
          <h3 className="font-display text-xl">{t.addTitle}</h3>
          <p className="text-sm text-muted">{username ? t.addTextWithName : t.addText}</p>
          {!username && (
            <label className="block">
              <span className="mb-1.5 block text-sm text-muted">{t.username}</span>
              <input name="username" autoComplete="username" required className={field} />
              <span className="mt-1.5 block text-xs text-muted">{t.usernameHint}</span>
            </label>
          )}
          <label className="block">
            <span className="mb-1.5 block text-sm text-muted">{t.newPassword}</span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className={field}
            />
            <span className="mt-1.5 block text-xs text-muted">{t.passwordHint}</span>
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={busy} className={primaryButton}>
              {busy ? t.pending : t.save}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setError(null);
              }}
              className={secondaryButton}
            >
              {t.cancel}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
