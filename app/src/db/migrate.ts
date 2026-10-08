import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

// Applies pending SQL migrations from ./drizzle. Run on every deploy, before the
// server starts (drizzle-kit is a dev dependency and isn't used in production).
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  console.log("Migrations applied.");
} finally {
  await pool.end();
}
