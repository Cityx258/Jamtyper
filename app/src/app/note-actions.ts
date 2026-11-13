"use server";

import { headers } from "next/headers";
import { chooseNote } from "@/db/notes";
import { auth } from "@/lib/auth";
import { isNote } from "@/lib/notes";

export async function pickNote(note: string): Promise<boolean> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isNote(note)) return false;
  return chooseNote(session.user.id, note);
}
