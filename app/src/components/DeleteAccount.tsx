"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { deleteAccount } from "@/app/settings-actions";
import { dangerButton, secondaryButton } from "@/components/ui";
import type { Dict } from "@/i18n/en";

const field =
  "w-full rounded-full border border-line bg-bg/70 px-5 py-3 text-ink placeholder:text-muted/60 focus:border-danger focus:outline-none";

export default function DeleteAccount({ t }: { t: Dict["settings"]["deleteAccount"] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await deleteAccount(typed).catch(() => ({ ok: false, error: "generic" }) as const);
    if (res.ok) {
      router.push("/");
      router.refresh();
      return;
    }
    setBusy(false);
    setError(t.errors[res.error]);
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={dangerButton}>
        {t.start}
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4" noValidate>
      <p className="text-sm text-ink">{t.warning}</p>
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">{t.confirmLabel.replace("{word}", t.word)}</span>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder={t.word}
          className={field}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={busy || typed.trim().toLowerCase() !== t.word.toLowerCase()}
          className={`${dangerButton} disabled:pointer-events-none disabled:opacity-50`}
        >
          {busy ? t.deleting : t.confirm}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTyped("");
            setError(null);
          }}
          className={secondaryButton}
        >
          {t.cancel}
        </button>
      </div>
    </form>
  );
}
