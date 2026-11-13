import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as player from "./player";
import * as recovery from "./recovery";
import * as rooms from "./rooms";
import * as auth from "./schema";

const schema = { ...auth, ...rooms, ...recovery, ...player };

const globalForDb = globalThis as unknown as { pool?: Pool };

const pool =
  globalForDb.pool ?? new Pool({ connectionString: process.env.DATABASE_URL });
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema });
