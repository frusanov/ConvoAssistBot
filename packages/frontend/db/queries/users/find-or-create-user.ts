import { db } from "@/db";
import { userBalanceTable } from "@/db/schema/balance.sql";
import { usersTable } from "@/db/schema/users.sql";
import { eq } from "drizzle-orm";
import { User } from "telegraf/types";
import { createUserBalance } from "../balance";

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
    user = await db.transaction(async (tx) => {
      const balance = await createUserBalance(tx);

      return {
        ...(
          await tx
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
    });
  }

  return user;
}
