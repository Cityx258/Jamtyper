"use client";

import { useEffect, useState } from "react";

type Props = {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
  className: string;
  armedClassName: string;
};

export default function ConfirmButton({
  label,
  confirmLabel,
  onConfirm,
  className,
  armedClassName,
}: Props) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(id);
  }, [armed]);

  return (
    <button
      type="button"
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      className={armed ? armedClassName : className}
    >
      {armed ? confirmLabel : label}
    </button>
  );
}
