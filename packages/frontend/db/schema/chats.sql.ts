import { jsonb, pgEnum, pgTable, uuid } from "drizzle-orm/pg-core";
import { essentials, essentialsWithTgId } from "./_common";
import { chatBalanceTable } from "./balance.sql";
import { usersTable } from "./users.sql";

export const chatTypeEnum = pgEnum("type", ["group", "private"]);

export const chatsTable = pgTable("chats", {
  ...essentialsWithTgId(),
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
    .$type<{
      transcribe: boolean;
      summarize: boolean;
      storeMessages: {
        amount: number;
        /**
         * Seconds
         */
        time: number;
      };
    }>(),
  balanceId: uuid()
    .notNull()
    .references(() => chatBalanceTable.id, { onDelete: "cascade" }),
});

export const chatToUserJunctionTable = pgTable("chat_to_user", {
  ...essentials(),
  chatId: uuid()
    .notNull()
    .references(() => chatsTable.id, { onDelete: "cascade" }),
  userId: uuid()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
});
