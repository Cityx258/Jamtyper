import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./schema";

export const recoveryCode = pgTable("recovery_code", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  codeHash: text("code_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
