"use client";

import { useEffect, useState } from "react";
import { smallButton, smallDangerButton } from "@/components/ui";
import type { Dict } from "@/i18n/en";

type Props = {
  name: string;
  t: Pick<Dict["room"], "kick" | "confirmKick">;
  onKick: () => void;
};

export default function KickButton({ name, t, onKick }: Props) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(id);
  }, [armed]);

  return (
    <button
      type="button"
      onClick={() => (armed ? onKick() : setArmed(true))}
      className={armed ? smallDangerButton : smallButton}
    >
      {armed ? t.confirmKick.replace("{name}", name) : t.kick}
    </button>
  );
}
