"use client";

import { useState } from "react";
import { primaryButton, secondaryButton } from "@/components/ui";
import type { Dict } from "@/i18n/en";

type Props = {
  code: string;
  t: Dict["login"]["recovery"];
  intro?: string;
  onDone?: () => void;
};

export default function RecoveryCodeNotice({ code, t, intro, onDone }: Props) {
  const [copied, setCopied] = useState(false);
  return (
    <div role="status" className="w-full max-w-md rounded-lg border border-teal bg-teal/10 p-5">
      <h2 className="font-display text-2xl">{t.saveTitle}</h2>
      <p className="mt-2 text-sm text-muted">{intro ?? t.saveText}</p>
      <p className="mt-4 select-all break-all rounded-lg border border-line bg-bg/70 px-4 py-3 text-center font-mono text-lg tracking-widest text-ink">
        {code}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard?.writeText(code).catch(() => {});
            setCopied(true);
          }}
          className={secondaryButton}
        >
          {copied ? t.copied : t.copy}
        </button>
        {onDone && (
          <button type="button" onClick={onDone} className={primaryButton}>
            {t.done}
          </button>
        )}
      </div>
    </div>
  );
}
