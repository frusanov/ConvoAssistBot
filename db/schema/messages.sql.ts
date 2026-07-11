import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { essentials, essentialsWithTgId } from "./_common";
import { chatsTable } from "./chats.sql";
import { usersTable } from "./users.sql";

export const messagesTable = pgTable("messages", {
  ...essentialsWithTgId(),
  text: text().notNull(),
  isForwarded: boolean("is_forwarded").notNull().default(false),
  isHiddenForPrivacy: boolean("is_hidden_for_privacy").notNull().default(false),
  chatId: uuid("chat_id")
    .notNull()
    .references(() => chatsTable.id),
  userId: uuid("user_id").references(() => usersTable.id),
});

export const messageToChatJunctionTable = pgTable("message_to_chat", {
  ...essentials(),
  messageId: uuid("message_id")
    .notNull()
    .references(() => messagesTable.id),
  chatId: uuid("chat_id")
    .notNull()
    .references(() => chatsTable.id),
});
