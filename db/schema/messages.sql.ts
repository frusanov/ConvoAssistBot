import { boolean, bigint, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { essentialsWithTgId } from "./_common";
import { chatsTable } from "./chats.sql";
import { usersTable } from "./users.sql";

export const messagesTable = pgTable("messages", {
  ...essentialsWithTgId(),
  text: text(),
  isHiddenForPrivacy: boolean("is_hidden_for_privacy").notNull().default(false),
  chatId: uuid("chat_id")
    .notNull()
    .references(() => chatsTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  chatTgId: bigint("chat_tg_id", { mode: "number" }).notNull(),
  userTgId: bigint("user_tg_id", { mode: "number" }),
  originalCreatedAt: timestamp("original_created_at", { mode: "date" }).notNull(),
});
