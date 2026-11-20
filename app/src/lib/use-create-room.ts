"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Visibility } from "./room-protocol";
import { requestCreateRoom } from "./socket";

export function useCreateRoom(visibility?: Visibility) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [otherRoom, setOtherRoom] = useState<string | null>(null);

  async function create(leaveOther = false) {
    setPending(true);
    setFailed(false);
    try {
      const res = await requestCreateRoom({ visibility, leaveOther });
      if (res.ok) {
        router.push(`/room/${res.room.code}`);
        return;
      }
      if (res.error === "in_other_room") {
        setOtherRoom(res.otherRoom ?? "");
        setPending(false);
        return;
      }
    } catch {}
    setFailed(true);
    setPending(false);
  }

  return { create, pending, failed, otherRoom };
}
