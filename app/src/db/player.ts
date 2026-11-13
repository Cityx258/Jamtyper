import { pgTable, text } from "drizzle-orm/pg-core";
import { user } from "./schema";

export const playerNote = pgTable("player_note", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
});
