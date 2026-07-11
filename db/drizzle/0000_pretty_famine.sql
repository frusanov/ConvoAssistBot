CREATE TYPE "public"."type" AS ENUM('group', 'private');--> statement-breakpoint
CREATE TYPE "public"."chat_user_role" AS ENUM('member', 'administrator', 'creator');--> statement-breakpoint
CREATE TABLE "chat_to_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"chat_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "chat_user_role" NOT NULL,
	"opted_out" boolean DEFAULT false NOT NULL,
	CONSTRAINT "chat_user_unique" UNIQUE("chat_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"tg_id" bigint NOT NULL,
	"title" text,
	"type" "type" NOT NULL,
	"settings" jsonb DEFAULT '{"transcribe":false,"summarize":false,"storeMessages":{"amount":1000,"time":604800}}'::jsonb NOT NULL,
	CONSTRAINT "chats_tg_id_unique" UNIQUE("tg_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"tg_id" bigint NOT NULL,
	"text" text,
	"is_hidden_for_privacy" boolean DEFAULT false NOT NULL,
	"chat_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"chat_tg_id" bigint NOT NULL,
	"user_tg_id" bigint,
	"original_created_at" timestamp NOT NULL,
	CONSTRAINT "messages_tg_id_unique" UNIQUE("tg_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"tg_id" bigint NOT NULL,
	"first_name" text,
	"last_name" text,
	"username" text,
	"privacySettings" jsonb DEFAULT '{"globallyOptedOut":false}'::jsonb NOT NULL,
	CONSTRAINT "users_tg_id_unique" UNIQUE("tg_id")
);
--> statement-breakpoint
ALTER TABLE "chat_to_user" ADD CONSTRAINT "chat_to_user_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_to_user" ADD CONSTRAINT "chat_to_user_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;