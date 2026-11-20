"use server";

import { headers } from "next/headers";
import { chooseNote } from "@/db/notes";
import { auth } from "@/lib/auth";
import { noteSchema } from "@/lib/schemas";

export async function pickNote(raw: unknown): Promise<boolean> {
  const parsed = noteSchema.shape.note.safeParse(raw);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !parsed.success) return false;
  return chooseNote(session.user.id, parsed.data);
}
