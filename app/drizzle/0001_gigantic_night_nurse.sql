CREATE TABLE "room" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"host_id" text NOT NULL,
	"visibility" text DEFAULT 'semi_public' NOT NULL,
	"status" text DEFAULT 'lobby' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	CONSTRAINT "room_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "room_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"user_id" text,
	"guest_name" text,
	"role" text DEFAULT 'racer' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_host_id_user_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_member" ADD CONSTRAINT "room_member_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_member" ADD CONSTRAINT "room_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "room_status_idx" ON "room" USING btree ("status");--> statement-breakpoint
CREATE INDEX "room_member_room_idx" ON "room_member" USING btree ("room_id");--> statement-breakpoint
CREATE UNIQUE INDEX "room_member_active_user_idx" ON "room_member" USING btree ("room_id","user_id") WHERE "room_member"."user_id" is not null and "room_member"."left_at" is null;