import { bigint, date, uuid, timestamp } from "drizzle-orm/pg-core";

export const essentials = () => ({
  id: uuid().defaultRandom().primaryKey().notNull(),
  createdAt: timestamp("created_at", {
    mode: "date",
  })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", {
    mode: "date",
  })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const essentialsWithTgId = () => ({
  ...essentials(),
  tgId: bigint("tg_id", { mode: "number" }).unique().notNull(),
});
