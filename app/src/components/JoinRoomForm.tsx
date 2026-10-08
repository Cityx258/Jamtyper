"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { primaryButton } from "@/components/ui";
import type { Dict } from "@/i18n/en";
import { CODE_LENGTH, cleanRoomCodeInput } from "@/lib/room-code";

type Props = { action: string; t: Dict["home"]["join"] };

export default function JoinRoomForm({ action, t }: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [invalid, setInvalid] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== CODE_LENGTH) {
      setInvalid(true);
      return;
    }
    router.push(`/room/${code}`);
  }

  return (
    <form onSubmit={onSubmit} className="self-start" noValidate>
      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="room-code">
          {t.label}
        </label>
        <input
          id="room-code"
          value={code}
          onChange={(e) => {
            setCode(cleanRoomCodeInput(e.target.value));
            setInvalid(false);
          }}
          placeholder={t.placeholder}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={CODE_LENGTH + 4}
          aria-invalid={invalid}
          className="w-36 rounded-lg border border-line bg-bg/70 px-4 py-2.5 font-mono text-lg uppercase tracking-[0.25em] text-ink placeholder:text-muted/50 focus:border-teal focus:outline-none"
        />
        <button type="submit" className={primaryButton}>
          {action}
        </button>
      </div>
      {invalid && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {t.invalid}
        </p>
      )}
    </form>
  );
}
