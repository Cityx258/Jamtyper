import { pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const passage = pgTable(
  "passage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    language: text("language").notNull(),
    theme: text("theme"),
    body: text("body").notNull(),
    author: text("author"),
  },
  (table) => [uniqueIndex("passage_language_body_idx").on(table.language, table.body)],
);
