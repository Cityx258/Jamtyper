"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { hasPassword, issueRecoveryCode } from "@/lib/recovery";
import { addPasswordSchema, passwordSchema, usernameSchema } from "@/lib/schemas";

export type AddPasswordResult =
  | { ok: true; code: string }
  | { ok: false; error: "username" | "taken" | "password" | "already" | "generic" };

function isUniqueViolation(e: unknown): boolean {
  const err = e as { code?: string; cause?: { code?: string } };
  return err?.code === "23505" || err?.cause?.code === "23505";
}

export async function addPassword(
  rawUsername: unknown,
  newPassword: unknown,
): Promise<AddPasswordResult> {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) return { ok: false, error: "generic" };
  const userId = session.user.id;
  if (await hasPassword(userId)) return { ok: false, error: "already" };
  const input = addPasswordSchema.safeParse({ username: rawUsername ?? undefined, password: newPassword });
  if (!input.success || !passwordSchema.safeParse(input.data.password).success) {
    return { ok: false, error: "password" };
  }

  const needsUsername = !session.user.username;
  if (needsUsername) {
    const parsed = usernameSchema.safeParse(input.data.username?.trim());
    if (!parsed.success) return { ok: false, error: "username" };
    const display = parsed.data;
    const username = display.toLowerCase();
    const [existing] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, username));
    if (existing) return { ok: false, error: "taken" };
    try {
      await db
        .update(user)
        .set({ username, displayUsername: display })
        .where(eq(user.id, userId));
    } catch (e) {
      return { ok: false, error: isUniqueViolation(e) ? "taken" : "generic" };
    }
  }

  try {
    await auth.api.setPassword({ body: { newPassword: input.data.password }, headers: h });
  } catch {
    if (needsUsername) {
      await db
        .update(user)
        .set({ username: null, displayUsername: null })
        .where(eq(user.id, userId));
    }
    return { ok: false, error: "generic" };
  }
  return { ok: true, code: await issueRecoveryCode(userId) };
}
