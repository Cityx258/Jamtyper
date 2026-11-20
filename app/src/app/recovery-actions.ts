"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { hasPassword, issueRecoveryCode, resetWithRecoveryCode } from "@/lib/recovery";
import { resetPasswordSchema } from "@/lib/schemas";

export async function createRecoveryCode(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !(await hasPassword(session.user.id))) return null;
  return issueRecoveryCode(session.user.id);
}

export async function resetPassword(username: unknown, code: unknown, password: unknown) {
  const parsed = resetPasswordSchema.safeParse({ username, code, password });
  if (!parsed.success) return { ok: false, error: "invalid" } as const;
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "local";
  return resetWithRecoveryCode(parsed.data.username, parsed.data.code, parsed.data.password, ip);
}
