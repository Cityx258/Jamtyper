import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: ["./src/db/schema.ts", "./src/db/rooms.ts"],
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
