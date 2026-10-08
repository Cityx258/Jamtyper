"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignOutButton({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await authClient.signOut();
        router.refresh();
      }}
      className="rounded-full px-2 py-2 sm:px-4 text-muted transition-colors hover:text-ink"
    >
      {label}
    </button>
  );
}
