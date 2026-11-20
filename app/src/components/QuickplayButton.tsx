"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import OtherRoomNotice from "@/components/OtherRoomNotice";
import { primaryButton, smallButton } from "@/components/ui";
import type { Dict } from "@/i18n/en";
import { requestQuickplay } from "@/lib/socket";
import { useCreateRoom } from "@/lib/use-create-room";

type Props = {
  signedIn: boolean;
  label: string;
  t: Dict["home"]["quickplay"];
  otherRoomT: Dict["room"]["otherRoom"];
};

const link = "text-teal underline underline-offset-4 hover:text-teal-bright";

export default function QuickplayButton({ signedIn, label, t, otherRoomT }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<"none" | "error" | null>(null);
  const publicRoom = useCreateRoom("public");

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
      <button type="button" onClick={play} disabled={pending} className={primaryButton}>
        {pending ? t.pending : label}
      </button>
      {problem === "error" && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {t.error}
        </p>
      )}
      {problem === "none" && (
        <div role="status" className="mt-3 max-w-sm text-sm text-muted">
          <p>{t.none}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {signedIn ? (
              <button
                type="button"
                onClick={() => publicRoom.create()}
                disabled={publicRoom.pending}
                className={smallButton}
              >
                {t.createPublic}
              </button>
            ) : (
              <Link href="/login" className={link}>
                {t.signIn}
              </Link>
            )}
            <Link href="/rooms" className={link}>
              {t.browse}
            </Link>
          </div>
          {publicRoom.otherRoom !== null && (
            <OtherRoomNotice
              code={publicRoom.otherRoom}
              t={otherRoomT}
              onLeave={() => publicRoom.create(true)}
            />
          )}
        </div>
      )}
    </div>
  );
}
