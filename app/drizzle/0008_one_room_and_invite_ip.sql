DROP INDEX "room_member_active_user_idx";--> statement-breakpoint
ALTER TABLE "invite_link" ADD COLUMN "used_ip" text;--> statement-breakpoint
ALTER TABLE "invite_link" ADD COLUMN "revoked_at" timestamp;--> statement-breakpoint
UPDATE "room_member" SET "left_at" = now() WHERE "left_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "room_member_one_room_idx" ON "room_member" USING btree ("user_id") WHERE "room_member"."user_id" is not null and "room_member"."left_at" is null;