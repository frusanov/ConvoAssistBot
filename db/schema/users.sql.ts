import { pgTable, uuid } from "drizzle-orm/pg-core";
import { essentialsWithTgId } from "./_common";
import { userBalanceTable } from "./balance.sql";

export const usersTable = pgTable("users", {
  ...essentialsWithTgId(),
  balanceId: uuid("balance_id")
    .notNull()
    .references(() => userBalanceTable.id, { onDelete: "cascade" }),
});
