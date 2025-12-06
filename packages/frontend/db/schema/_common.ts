import { date, integer, uuid } from "drizzle-orm/pg-core";

export const essentials = () => ({
  id: uuid().defaultRandom().primaryKey().notNull(),
  createdAt: date("created_at", {
    mode: "date",
  })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: date("updated_at", {
    mode: "date",
  })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const essentialsWithTgId = () => ({
  ...essentials(),
  tgId: integer().unique().notNull(),
});
