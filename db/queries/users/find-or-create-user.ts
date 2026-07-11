import { db } from "@/db";
import { usersTable } from "@/db/schema/users.sql";
import { eq } from "drizzle-orm";
import type { User } from "telegraf/types";

export async function findOrCreateUser(tgUser: User) {
  let [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.tgId, tgUser.id));

  if (!user) {
    [user] = await db
      .insert(usersTable)
      .values({
        tgId: tgUser.id,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name ?? null,
        username: tgUser.username ?? null,
      })
      .returning();
  }

  return user;
}
