import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./schema";

export const room = pgTable(
  "room",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    hostId: text("host_id").references(() => user.id, { onDelete: "set null" }),
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
    uniqueIndex("room_member_one_room_idx")
      .on(table.userId)
      .where(sql`${table.userId} is not null and ${table.leftAt} is null`),
  ],
);

export const inviteLink = pgTable(
  "invite_link",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => room.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    usedBy: uuid("used_by").references(() => roomMember.id, {
      onDelete: "set null",
    }),
    usedIp: text("used_ip"),
    revokedAt: timestamp("revoked_at"),
  },
  (table) => [index("invite_link_room_idx").on(table.roomId)],
);

export const race = pgTable(
  "race",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => room.id, { onDelete: "cascade" }),
    textBody: text("text_body").notNull(),
    settings: jsonb("settings").notNull().default({}),
    startedAt: timestamp("started_at").notNull(),
    endedAt: timestamp("ended_at"),
  },
  (table) => [index("race_room_idx").on(table.roomId)],
);

export const raceResult = pgTable(
  "race_result",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    raceId: uuid("race_id")
      .notNull()
      .references(() => race.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    displayName: text("display_name").notNull(),
    isBot: boolean("is_bot").notNull().default(false),
    position: integer("position").notNull(),
    wpm: numeric("wpm", { precision: 6, scale: 2, mode: "number" }).notNull(),
    accuracy: numeric("accuracy", {
      precision: 5,
      scale: 4,
      mode: "number",
    }).notNull(),
    missedKeys: jsonb("missed_keys").notNull().default({}),
    outcome: text("outcome", {
      enum: ["finished", "forfeited", "kicked", "eliminated", "timed_out"],
    }).notNull(),
    rawWpm: numeric("raw_wpm", { precision: 6, scale: 2, mode: "number" }).notNull().default(0),
    mistakes: integer("mistakes").notNull().default(0),
    errors: integer("errors").notNull().default(0),
    bonuses: integer("bonuses").notNull().default(0),
    progress: integer("progress").notNull().default(0),
    textEnd: integer("text_end").notNull().default(0),
    timeMs: integer("time_ms"),
    samples: jsonb("samples").$type<number[]>().notNull().default([]),
    note: text("note").notNull().default("whole"),
    pitches: jsonb("pitches").$type<number[]>().notNull().default([]),
    team: integer("team"),
    record: boolean("record").notNull().default(false),
  },
  (table) => [
    index("race_result_race_idx").on(table.raceId),
    index("race_result_user_idx").on(table.userId),
    index("race_result_race_place_idx").on(table.raceId, table.position),
  ],
);

export const roomRelations = relations(room, ({ many, one }) => ({
  members: many(roomMember),
  races: many(race),
  invites: many(inviteLink),
  host: one(user, { fields: [room.hostId], references: [user.id] }),
}));

export const roomMemberRelations = relations(roomMember, ({ one }) => ({
  room: one(room, { fields: [roomMember.roomId], references: [room.id] }),
  user: one(user, { fields: [roomMember.userId], references: [user.id] }),
}));

export const inviteLinkRelations = relations(inviteLink, ({ one }) => ({
  room: one(room, { fields: [inviteLink.roomId], references: [room.id] }),
}));

export const raceRelations = relations(race, ({ many, one }) => ({
  room: one(room, { fields: [race.roomId], references: [room.id] }),
  results: many(raceResult),
}));

export const raceResultRelations = relations(raceResult, ({ one }) => ({
  race: one(race, { fields: [raceResult.raceId], references: [race.id] }),
  user: one(user, { fields: [raceResult.userId], references: [user.id] }),
}));
