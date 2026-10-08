"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { primaryButton } from "@/components/ui";
import type { Dict } from "@/i18n/en";
import { requestCreateRoom } from "@/lib/socket";

type Props = {
  signedIn: boolean;
  label: string;
  t: Dict["home"]["create"];
};

export default function CreateRoomButton({ signedIn, label, t }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  // Guests can join rooms but not host them (see the client Q&A in the spec).
  if (!signedIn) {
    return (
      <Link href="/login" className={`self-start ${primaryButton}`}>
        {t.signInToHost}
      </Link>
    );
  }

  async function create() {
    setPending(true);
    setFailed(false);
    try {
      const res = await requestCreateRoom();
      if (res.ok) {
        router.push(`/room/${res.room.code}`);
        return;
      }
    } catch {
      // fall through to the error message
    }
    setFailed(true);
    setPending(false);
  }

  return (
    <div className="self-start">
      <button
        type="button"
        onClick={create}
        disabled={pending}
        className={primaryButton}
      >
        {pending ? t.pending : label}
      </button>
      {failed && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {t.error}
        </p>
      )}
    </div>
  );
}
