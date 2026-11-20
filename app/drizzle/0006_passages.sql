CREATE TABLE "passage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"language" text NOT NULL,
	"theme" text,
	"body" text NOT NULL,
	"author" text
);
--> statement-breakpoint
CREATE UNIQUE INDEX "passage_language_body_idx" ON "passage" USING btree ("language","body");