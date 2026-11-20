import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import sharp from "sharp";
import { db } from "@/db";
import { userAvatar } from "@/db/avatar";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { AVATAR_MAX_BYTES, AVATAR_SIZE, checkAvatar } from "@/lib/avatar";

const reply = (status: number, body: object) => Response.json(body, { status });

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return reply(401, { error: "not_signed_in" });

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > AVATAR_MAX_BYTES + 64 * 1024) return reply(413, { error: "too_big" });

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("photo");
  } catch {
    return reply(400, { error: "unreadable" });
  }
  if (!(file instanceof File)) return reply(400, { error: "unreadable" });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const problem = checkAvatar(bytes);
  if (problem) return reply(problem === "too_big" ? 413 : 415, { error: problem });

  let image: Buffer;
  try {
    image = await sharp(bytes, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover" })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return reply(415, { error: "unreadable" });
  }

  const now = new Date();
  const url = `/api/avatar/${session.user.id}?v=${now.getTime()}`;
  await db
    .insert(userAvatar)
    .values({ userId: session.user.id, image, updatedAt: now })
    .onConflictDoUpdate({ target: userAvatar.userId, set: { image, updatedAt: now } });
  await db.update(user).set({ image: url }).where(eq(user.id, session.user.id));
  return reply(200, { url });
}

export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return reply(401, { error: "not_signed_in" });
  await db.delete(userAvatar).where(eq(userAvatar.userId, session.user.id));
  await db.update(user).set({ image: null }).where(eq(user.id, session.user.id));
  return reply(200, {});
}
