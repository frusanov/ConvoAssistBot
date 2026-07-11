import {
  jsonb,
  pgEnum,
  pgTable,
  uuid,
  unique,
  text,
} from "drizzle-orm/pg-core";
import { essentials, essentialsWithTgId } from "./_common";
import { chatBalanceTable } from "./balance.sql";
import { usersTable } from "./users.sql";
import { ChatSetings } from "@/types/chats";

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
        time: 3600 * 24 * 7,
      },
    })
    .notNull()
    .$type<ChatSetings>(),
  balanceId: uuid("balance_id")
    .notNull()
    .references(() => chatBalanceTable.id, { onDelete: "cascade" }),
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
  },
  (table) => [unique("chat_user_unique").on(table.chatId, table.userId)],
);
