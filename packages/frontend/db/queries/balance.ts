import { eq } from "drizzle-orm";
import { db } from "..";
import { chatBalanceTable, userBalanceTable } from "../schema/balance.sql";

export async function createUserBalance() {
  return (await db.insert(userBalanceTable).values({}).returning())[0];
}

export async function createChatBalance() {
  return (await db.insert(chatBalanceTable).values({}).returning())[0];
}
