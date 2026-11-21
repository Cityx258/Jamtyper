ALTER TABLE "room" DROP CONSTRAINT "room_host_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "room" ALTER COLUMN "host_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_host_id_user_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;