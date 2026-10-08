import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as rooms from "./rooms";
import * as auth from "./schema";

const schema = { ...auth, ...rooms };

const globalForDb = globalThis as unknown as { pool?: Pool };

// Reuse one pool across hot reloads in dev so we don't exhaust connections.
const pool =
  globalForDb.pool ?? new Pool({ connectionString: process.env.DATABASE_URL });
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema });
