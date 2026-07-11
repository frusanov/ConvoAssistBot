import { db } from "@/db";
import { usersTable } from "@/db/schema/users.sql";
import { eq } from "drizzle-orm";

export async function findByTgId(tgId: number) {
  return await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.tgId, tgId))
    .then((r) => r[0] ?? null);
}
