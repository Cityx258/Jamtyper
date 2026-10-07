"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await authClient.signOut();
        router.refresh();
      }}
      className="rounded-full px-4 py-2 text-muted transition-colors hover:text-ink"
    >
      Sign out
    </button>
  );
}
