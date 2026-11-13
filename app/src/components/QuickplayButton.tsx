"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { primaryButton } from "@/components/ui";
import type { Dict } from "@/i18n/en";
import { requestQuickplay } from "@/lib/socket";

type Props = {
  signedIn: boolean;
  label: string;
  t: Dict["home"]["quickplay"];
};

export default function QuickplayButton({ signedIn, label, t }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<"none" | "error" | null>(null);

  async function play() {
    setPending(true);
    setProblem(null);
    try {
      const res = await requestQuickplay();
      if (res.ok) {
        router.push(`/room/${res.code}`);
        return;
      }
      setProblem(res.error === "no_public_room" ? "none" : "error");
    } catch {
      setProblem("error");
    }
    setPending(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={play}
        disabled={pending}
        className={primaryButton}
      >
        {pending ? t.pending : label}
      </button>
      {problem === "error" && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {t.error}
        </p>
      )}
      {problem === "none" && (
        <p role="alert" className="mt-2 text-sm text-muted">
          {t.none}{" "}
          {!signedIn && (
            <Link
              href="/login"
              className="text-teal underline underline-offset-4 hover:text-teal-bright"
            >
              {t.signIn}
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
