"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Dict } from "@/i18n/en";
import { requestCreateRoom } from "@/lib/socket";

type Props = {
  signedIn: boolean;
  t: Dict["home"]["create"];
};

const linkStyle =
  "text-sm text-teal underline underline-offset-4 hover:text-teal-bright disabled:opacity-60";

export default function CreateRoomButton({ signedIn, t }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!signedIn) {
    return (
      <Link href="/login" className={`self-start ${linkStyle}`}>
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
        className={linkStyle}
      >
        {pending ? t.pending : t.hostOwn}
      </button>
      {failed && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {t.error}
        </p>
      )}
    </div>
  );
}
