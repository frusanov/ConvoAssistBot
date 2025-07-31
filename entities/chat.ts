import { pgTable, uuid, integer, jsonb } from "drizzle-orm/pg-core";
import { commonColumns } from "./_common";
import { messagesTable } from "./message";
import {
  relations,
  type InferSelectModel,
  type InferInsertModel,
} from "drizzle-orm";

export const chatsTable = pgTable("chats", {
  ...commonColumns,
  telegramChatId: integer().notNull(),
  settings: jsonb()
    .notNull()
    .$type<{
      saveHistory?: boolean;
      /**
       * in seconds
       */
      historyDateLimit?: number | null;
      historySizeLimit?: number | null;
    }>()
    .default({}),
});

export const chatsRelations = relations(chatsTable, ({ many }) => ({
  messages: many(messagesTable),
}));

export type ChatSelect = InferSelectModel<typeof chatsTable>;
export type ChatInsert = InferInsertModel<typeof chatsTable>;
