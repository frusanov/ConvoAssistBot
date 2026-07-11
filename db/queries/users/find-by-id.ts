import { db } from "@/db";
import { usersTable } from "@/db/schema/users.sql";
import { eq } from "drizzle-orm";

export async function findById(id: string) {
  return await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .then((r) => r[0] ?? null);
}
