"use client";

import ConfirmButton from "@/components/ConfirmButton";
import { smallButton, smallDangerButton } from "@/components/ui";
import type { Dict } from "@/i18n/en";

type Props = {
  name: string;
  t: Pick<Dict["room"], "kick" | "confirmKick">;
  onKick: () => void;
};

export default function KickButton({ name, t, onKick }: Props) {
  return (
    <ConfirmButton
      label={t.kick}
      confirmLabel={t.confirmKick.replace("{name}", name)}
      onConfirm={onKick}
      className={smallButton}
      armedClassName={smallDangerButton}
    />
  );
}
