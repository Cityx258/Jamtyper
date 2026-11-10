CREATE TABLE "race" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"text_body" text NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "race_result" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"race_id" uuid NOT NULL,
	"user_id" text,
	"display_name" text NOT NULL,
	"is_bot" boolean DEFAULT false NOT NULL,
	"position" integer NOT NULL,
	"wpm" numeric(6, 2) NOT NULL,
	"accuracy" numeric(5, 4) NOT NULL,
	"missed_keys" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"outcome" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "race" ADD CONSTRAINT "race_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_result" ADD CONSTRAINT "race_result_race_id_race_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."race"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_result" ADD CONSTRAINT "race_result_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "race_room_idx" ON "race" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "race_result_race_idx" ON "race_result" USING btree ("race_id");--> statement-breakpoint
CREATE INDEX "race_result_user_idx" ON "race_result" USING btree ("user_id");