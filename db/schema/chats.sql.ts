import { boolean, jsonb, pgEnum, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { essentials, essentialsWithTgId } from "./_common";
import { usersTable } from "./users.sql";
import type { ChatSetings } from "@/types/chats";

export const chatTypeEnum = pgEnum("type", ["group", "private"]);

export const chatsTable = pgTable("chats", {
  ...essentialsWithTgId(),
  title: text(),
  type: chatTypeEnum().notNull(),
  settings: jsonb()
    .default({
      transcribe: false,
      summarize: false,
      storeMessages: {
        amount: 1000,
        time: 604800,
      },
    })
    .notNull()
    .$type<ChatSetings>(),
});

export const chatUserRoleEnum = pgEnum("chat_user_role", [
  "member",
  "administrator",
  "creator",
]);

export const chatToUserJunctionTable = pgTable(
  "chat_to_user",
  {
    ...essentials(),
    chatId: uuid("chat_id")
      .notNull()
      .references(() => chatsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    role: chatUserRoleEnum().notNull(),
    optedOut: boolean("opted_out").notNull().default(false),
  },
  (table) => [unique("chat_user_unique").on(table.chatId, table.userId)],
);
