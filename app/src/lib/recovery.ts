import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { recoveryCode } from "@/db/recovery";
import { account, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  hashRecoveryCode,
  newRecoveryCode,
  normalizeRecoveryCode,
  sameHash,
} from "@/lib/recovery-code";

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60_000;

const attempts = new Map<string, { count: number; resetAt: number }>();

function limited(key: string, now = Date.now()): boolean {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_ATTEMPTS;
}

export async function hasPassword(userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "credential")));
  return rows.length > 0;
}

export async function issueRecoveryCode(userId: string): Promise<string> {
  const code = newRecoveryCode();
  const codeHash = hashRecoveryCode(normalizeRecoveryCode(code)!);
  await db
    .insert(recoveryCode)
    .values({ userId, codeHash })
    .onConflictDoUpdate({
      target: recoveryCode.userId,
      set: { codeHash, createdAt: new Date() },
    });
  return code;
}

export type ResetResult =
  | { ok: true; code: string }
  | { ok: false; error: "invalid" | "password" | "limited" };

export async function resetWithRecoveryCode(
  rawUsername: unknown,
  rawCode: unknown,
  newPassword: unknown,
  ip: string,
): Promise<ResetResult> {
  const username = typeof rawUsername === "string" ? rawUsername.trim().toLowerCase() : "";
  if (limited(`ip:${ip}`) || (username && limited(`user:${username}`))) {
    return { ok: false, error: "limited" };
  }
  if (
    typeof newPassword !== "string" ||
    newPassword.length < PASSWORD_MIN ||
    newPassword.length > PASSWORD_MAX
  ) {
    return { ok: false, error: "password" };
  }
  const code = normalizeRecoveryCode(rawCode);
  if (!username || !code) return { ok: false, error: "invalid" };

  const [found] = await db
    .select({ id: user.id, codeHash: recoveryCode.codeHash })
    .from(user)
    .innerJoin(recoveryCode, eq(recoveryCode.userId, user.id))
    .where(eq(user.username, username));
  if (!found || !sameHash(found.codeHash, hashRecoveryCode(code))) {
    return { ok: false, error: "invalid" };
  }
  if (!(await hasPassword(found.id))) return { ok: false, error: "invalid" };

  const ctx = await auth.$context;
  await ctx.internalAdapter.updatePassword(found.id, await ctx.password.hash(newPassword));
  await ctx.internalAdapter.deleteUserSessions(found.id);
  attempts.delete(`user:${username}`);
  return { ok: true, code: await issueRecoveryCode(found.id) };
}
