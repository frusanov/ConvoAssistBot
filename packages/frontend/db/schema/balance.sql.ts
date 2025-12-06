import { integer, pgEnum, pgTable } from "drizzle-orm/pg-core";
import { essentials } from "./_common";

export const tariffEnum = pgEnum("tariff", ["default", "free", "minimal"]);

const baseBalanceRow = () => ({
  ...essentials(),
  points: integer().notNull().default(0),
  tariff: tariffEnum().default("default").notNull(),
});

export const userBalanceTable = pgTable("user_balance", {
  ...baseBalanceRow(),
});

export const chatBalanceTable = pgTable("chat_balance", {
  ...baseBalanceRow(),
});
