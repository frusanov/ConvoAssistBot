import { date, uuid } from "drizzle-orm/pg-core";

export const commonColumns = {
  id: uuid().primaryKey().defaultRandom(),
  createdAt: date({
    mode: "date",
  })
    .notNull()
    .defaultNow(),
  updatedAt: date({
    mode: "date",
  })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
};
