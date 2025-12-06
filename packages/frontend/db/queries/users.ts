import type { User } from "telegraf/types";
import { db } from "..";
import { eq } from "drizzle-orm";
import { createUserBalance } from "./balance";
import { usersTable } from "../schema/users.sql";
import { userBalanceTable } from "../schema/balance.sql";

export async function findOrCreateUser(tgUser: Pick<User, "id">) {
  const userSelection = {
    id: usersTable.id,
    tgId: usersTable.tgId,
    createdAt: usersTable.createdAt,
    updatedAt: usersTable.updatedAt,
  };

  let [user] = await db
    .select({
      ...userSelection,
      balance: userBalanceTable,
    })
    .from(usersTable)
    .leftJoin(userBalanceTable, eq(usersTable.balanceId, userBalanceTable.id))
    .where(eq(usersTable.tgId, tgUser.id));

  if (!user) {
    const balance = await createUserBalance();

    user = {
      ...(
        await db
          .insert(usersTable)
          .values({
            tgId: tgUser.id,
            balanceId: balance.id,
          })
          .returning({
            ...userSelection,
          })
      )[0],
      balance,
    };
  }

  return user;
}
