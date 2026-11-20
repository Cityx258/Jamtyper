import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userAvatar } from "@/db/avatar";
import { avatarIdSchema } from "@/lib/schemas";

export async function GET(_: Request, ctx: RouteContext<"/api/avatar/[id]">) {
  const id = avatarIdSchema.safeParse((await ctx.params).id);
  if (!id.success) return new Response(null, { status: 404 });
  const [row] = await db.select().from(userAvatar).where(eq(userAvatar.userId, id.data));
  if (!row) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(row.image), {
    headers: {
      "content-type": "image/webp",
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
