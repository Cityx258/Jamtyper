"use client";

import Link from "next/link";
import { useState } from "react";
import { resetPassword } from "@/app/recovery-actions";
import RecoveryCodeNotice from "@/components/RecoveryCodeNotice";
import type { Dict } from "@/i18n/en";

const field =
  "w-full rounded-lg border border-line bg-bg/70 px-4 py-3 text-ink placeholder:text-muted/60 focus:border-teal focus:outline-none";

export default function ResetPasswordForm({ t }: { t: Dict["login"]["recovery"] }) {
  const [error, setError] = useState<keyof typeof t.errors | null>(null);
  const [pending, setPending] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setError(null);
    setPending(true);
    const res = await resetPassword(
      String(data.get("username") ?? ""),
      String(data.get("code") ?? ""),
      String(data.get("password") ?? ""),
    ).catch(() => ({ ok: false as const, error: "invalid" as const }));
    setPending(false);
    if (res.ok) setNewCode(res.code);
    else setError(res.error);
  }

  if (newCode) {
    return (
      <div className="w-full max-w-md">
        <RecoveryCodeNotice code={newCode} t={t} intro={t.success} />
        <Link
          href="/login"
          className="mt-6 inline-block text-teal underline underline-offset-4 hover:text-teal-bright"
        >
          {t.signIn}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md space-y-4" noValidate>
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">{t.username}</span>
        <input name="username" autoComplete="username" required className={field} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">{t.code}</span>
        <input
          name="code"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="ABCD-EFGH-JKLM-NPQR"
          required
          className={`${field} font-mono tracking-widest`}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">{t.newPassword}</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
          className={field}
        />
        <span className="mt-1.5 block text-xs text-muted">{t.passwordHint}</span>
      </label>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {t.errors[error]}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-teal px-6 py-3 font-bold text-on-teal transition-colors hover:bg-teal-bright disabled:opacity-60"
      >
        {pending ? t.pending : t.submit}
      </button>
      <p className="text-sm text-muted">{t.noCode}</p>
    </form>
  );
}
