import { customType, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./schema";

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

export const userAvatar = pgTable("user_avatar", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  image: bytea("image").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
