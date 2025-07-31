import {
  pgTable,
  uuid,
  integer,
  jsonb,
  date,
  varchar,
} from "drizzle-orm/pg-core";
import { commonColumns } from "./_common";
import { chatsTable } from "./chat";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const scenesTable = pgTable("scenes", {
  ...commonColumns,
  chat: uuid("chat")
    .references(() => chatsTable.id)
    .unique()
    .notNull(),
  scene: varchar({
    enum: ["default", "settings-main", "settings-history"],
    length: 255,
  })
    .default("default")
    .notNull(),
  context: jsonb().notNull(),
});

export type ScenesSelect = InferSelectModel<typeof scenesTable>;
export type ScenesInsert = InferInsertModel<typeof scenesTable>;

export type SceneKind = ScenesSelect["scene"];
