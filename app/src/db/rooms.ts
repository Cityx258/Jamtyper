import { relations, sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./schema";

// Kept apart from schema.ts, which Better Auth's CLI generates and may overwrite.

export const room = pgTable(
  "room",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // 6 characters, see server/codes.ts
    code: text("code").notNull().unique(),
    hostId: text("host_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    visibility: text("visibility", {
      enum: ["public", "semi_public", "private"],
    })
      .notNull()
      .default("semi_public"),
    status: text("status", {
      enum: ["lobby", "countdown", "racing", "finishing", "results", "closed"],
    })
      .notNull()
      .default("lobby"),
    settings: jsonb("settings").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    closedAt: timestamp("closed_at"),
  },
  (table) => [index("room_status_idx").on(table.status)],
);

export const roomMember = pgTable(
  "room_member",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => room.id, { onDelete: "cascade" }),
    // Exactly one of userId / guestName is set.
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    guestName: text("guest_name"),
    role: text("role", { enum: ["racer", "spectator"] })
      .notNull()
      .default("racer"),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
    leftAt: timestamp("left_at"),
  },
  (table) => [
    index("room_member_room_idx").on(table.roomId),
    // A signed-in user has at most one active seat per room.
    uniqueIndex("room_member_active_user_idx")
      .on(table.roomId, table.userId)
      .where(sql`${table.userId} is not null and ${table.leftAt} is null`),
  ],
);

export const roomRelations = relations(room, ({ many, one }) => ({
  members: many(roomMember),
  host: one(user, { fields: [room.hostId], references: [user.id] }),
}));

export const roomMemberRelations = relations(roomMember, ({ one }) => ({
  room: one(room, { fields: [roomMember.roomId], references: [room.id] }),
  user: one(user, { fields: [roomMember.userId], references: [user.id] }),
}));
