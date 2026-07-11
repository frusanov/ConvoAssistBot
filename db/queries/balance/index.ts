import { db } from "@/db";
import { chatBalanceTable, userBalanceTable } from "@/db/schema/balance.sql";
import { TransactionContext } from "@/types/db";

export async function createUserBalance(tx?: TransactionContext) {
  return (await (tx || db).insert(userBalanceTable).values({}).returning())[0];
}

export async function createChatBalance(tx?: TransactionContext) {
  return (await (tx || db).insert(chatBalanceTable).values({}).returning())[0];
}

export const balanceQueries = {
  createUserBalance,
  createChatBalance,
};
