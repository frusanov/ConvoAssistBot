import {
  pgTable,
  uuid,
  integer,
  jsonb,
  date,
  timestamp,
} from "drizzle-orm/pg-core";
import { commonColumns } from "./_common";
import { relations } from "drizzle-orm";
import { chatsTable } from "./chat";
import type { Message, Update } from "telegraf/types";
import type { Context } from "telegraf";

export const messagesTable = pgTable("messages", {
  ...commonColumns,
  chat: uuid().notNull(),
  messageId: integer().notNull(),
  originalCreatedAt: timestamp({
    mode: "date",
  }).notNull(),
  originalUpdatedAt: timestamp({
    mode: "date",
  }),
  data: jsonb()
    .notNull()
    .$type<
      (Message.TextMessage | Exclude<Context["editedMessage"], undefined>) & {
        text: string;
      }
    >(),
});

export const messagesRelations = relations(messagesTable, ({ one }) => ({
  chat: one(chatsTable, {
    fields: [messagesTable.chat],
    references: [chatsTable.id],
  }),
}));
