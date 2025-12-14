CREATE TYPE "public"."chat_user_role" AS ENUM('member', 'administrator', 'creator');--> statement-breakpoint
ALTER TABLE "chat_to_user" ADD COLUMN "role" "chat_user_role" NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_to_user" ADD CONSTRAINT "chat_user_unique" UNIQUE("chat_id","user_id");