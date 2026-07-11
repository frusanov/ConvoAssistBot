CREATE TYPE "public"."tariff" AS ENUM('default', 'free', 'minimal');--> statement-breakpoint
CREATE TYPE "public"."type" AS ENUM('group', 'private');--> statement-breakpoint
CREATE TABLE "chat_balance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" date NOT NULL,
	"updated_at" date NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"tariff" "tariff" DEFAULT 'default' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_balance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" date NOT NULL,
	"updated_at" date NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"tariff" "tariff" DEFAULT 'default' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_to_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" date NOT NULL,
	"updated_at" date NOT NULL,
	"chat_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" date NOT NULL,
	"updated_at" date NOT NULL,
	"tg_id" bigint NOT NULL,
	"type" "type" NOT NULL,
	"settings" jsonb DEFAULT '{"transcribe":false,"summarize":false,"storeMessages":{"amount":1000,"time":604800}}'::jsonb NOT NULL,
	"balance_id" uuid NOT NULL,
	CONSTRAINT "chats_tg_id_unique" UNIQUE("tg_id")
);
--> statement-breakpoint
CREATE TABLE "message_to_chat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" date NOT NULL,
	"updated_at" date NOT NULL,
	"message_id" uuid NOT NULL,
	"chat_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" date NOT NULL,
	"updated_at" date NOT NULL,
	"tg_id" bigint NOT NULL,
	"text" text NOT NULL,
	"is_forwarded" boolean DEFAULT false NOT NULL,
	"is_hidden_for_privacy" boolean DEFAULT false NOT NULL,
	"chat_id" uuid NOT NULL,
	"user_id" uuid,
	CONSTRAINT "messages_tg_id_unique" UNIQUE("tg_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" date NOT NULL,
	"updated_at" date NOT NULL,
	"tg_id" bigint NOT NULL,
	"balance_id" uuid NOT NULL,
	CONSTRAINT "users_tg_id_unique" UNIQUE("tg_id")
);
--> statement-breakpoint
ALTER TABLE "chat_to_user" ADD CONSTRAINT "chat_to_user_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_to_user" ADD CONSTRAINT "chat_to_user_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_balance_id_chat_balance_id_fk" FOREIGN KEY ("balance_id") REFERENCES "public"."chat_balance"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_to_chat" ADD CONSTRAINT "message_to_chat_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_to_chat" ADD CONSTRAINT "message_to_chat_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_balance_id_user_balance_id_fk" FOREIGN KEY ("balance_id") REFERENCES "public"."user_balance"("id") ON DELETE cascade ON UPDATE no action;