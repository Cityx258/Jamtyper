"use client";

import { useState } from "react";
import { createRecoveryCode } from "@/app/recovery-actions";
import RecoveryCodeNotice from "@/components/RecoveryCodeNotice";
import { secondaryButton } from "@/components/ui";
import type { Dict } from "@/i18n/en";

export default function RecoveryCodeSection({ t }: { t: Dict["login"]["recovery"] }) {
  const [code, setCode] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <section className="mt-16" aria-labelledby="recovery-title">
      <h2 id="recovery-title" className="font-display text-3xl">
        {t.profileTitle}
      </h2>
      <p className="mt-2 max-w-xl text-muted">{t.profileText}</p>
      <div className="mt-6">
        {code ? (
          <RecoveryCodeNotice code={code} t={t} onDone={() => setCode(null)} />
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              setCode(await createRecoveryCode().catch(() => null));
              setPending(false);
            }}
            className={secondaryButton}
          >
            {t.profileButton}
          </button>
        )}
      </div>
    </section>
  );
}
