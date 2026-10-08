import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  // Render injects RENDER_EXTERNAL_URL (the public https:// address) automatically.
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.RENDER_EXTERNAL_URL,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  plugins: [username(), nextCookies()],
});
