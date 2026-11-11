import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const PROVIDERS = ["discord", "github"] as const;
export type Provider = (typeof PROVIDERS)[number];

function credentials(prefix: string) {
  const clientId = process.env[`${prefix}_CLIENT_ID`];
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`];
  return clientId && clientSecret ? { clientId, clientSecret } : undefined;
}

const socialProviders = {
  discord: credentials("DISCORD"),
  github: credentials("GITHUB"),
};

export const enabledProviders: Provider[] = PROVIDERS.filter(
  (p) => socialProviders[p],
);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.RENDER_EXTERNAL_URL,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: Object.fromEntries(
    Object.entries(socialProviders).filter(([, c]) => c),
  ),
  plugins: [username(), nextCookies()],
});
