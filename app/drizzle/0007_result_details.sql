ALTER TABLE "race_result" ADD COLUMN "raw_wpm" numeric(6, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "race_result" ADD COLUMN "mistakes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "race_result" ADD COLUMN "errors" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "race_result" ADD COLUMN "bonuses" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "race_result" ADD COLUMN "progress" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "race_result" ADD COLUMN "text_end" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "race_result" ADD COLUMN "time_ms" integer;--> statement-breakpoint
ALTER TABLE "race_result" ADD COLUMN "samples" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "race_result" ADD COLUMN "note" text DEFAULT 'whole' NOT NULL;--> statement-breakpoint
ALTER TABLE "race_result" ADD COLUMN "pitches" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "race_result" ADD COLUMN "team" integer;--> statement-breakpoint
ALTER TABLE "race_result" ADD COLUMN "record" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "race_result_race_place_idx" ON "race_result" USING btree ("race_id","position");