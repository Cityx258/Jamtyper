"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { hasPassword, issueRecoveryCode, resetWithRecoveryCode } from "@/lib/recovery";

export async function createRecoveryCode(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !(await hasPassword(session.user.id))) return null;
  return issueRecoveryCode(session.user.id);
}

export async function resetPassword(username: string, code: string, password: string) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "local";
  return resetWithRecoveryCode(username, code, password, ip);
}
