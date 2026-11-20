"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { displayNameSchema } from "@/lib/schemas";

export async function updateDisplayName(raw: unknown): Promise<{ ok: boolean }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false };
  const name = displayNameSchema.safeParse(raw);
  if (!name.success) return { ok: false };
  await db.update(user).set({ displayUsername: name.data }).where(eq(user.id, session.user.id));
  revalidatePath("/", "layout");
  return { ok: true };
}
