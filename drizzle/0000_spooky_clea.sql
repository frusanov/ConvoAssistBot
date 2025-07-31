CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" date DEFAULT now() NOT NULL,
	"updatedAt" date DEFAULT now() NOT NULL,
	"telegramChatId" integer NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" date DEFAULT now() NOT NULL,
	"updatedAt" date DEFAULT now() NOT NULL,
	"chat" uuid NOT NULL,
	"messageId" integer NOT NULL,
	"originalCreatedAt" timestamp NOT NULL,
	"originalUpdatedAt" timestamp,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" date DEFAULT now() NOT NULL,
	"updatedAt" date DEFAULT now() NOT NULL,
	"chat" uuid NOT NULL,
	"scene" varchar(255) DEFAULT 'default' NOT NULL,
	"context" jsonb NOT NULL,
	CONSTRAINT "scenes_chat_unique" UNIQUE("chat")
);
--> statement-breakpoint
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_chat_chats_id_fk" FOREIGN KEY ("chat") REFERENCES "public"."chats"("id") ON DELETE no action ON UPDATE no action;