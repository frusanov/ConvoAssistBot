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
  data: jsonb().notNull(),
});

export const messagesRelations = relations(messagesTable, ({ one }) => ({
  chat: one(chatsTable, {
    fields: [messagesTable.chat],
    references: [chatsTable.id],
  }),
}));
