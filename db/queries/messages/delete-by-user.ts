import { db } from "@/db";
import { messagesTable } from "@/db/schema/messages.sql";
import { eq } from "drizzle-orm";

export async function deleteMessagesByUser(userId: string) {
  return await db
    .delete(messagesTable)
    .where(eq(messagesTable.userId, userId));
}
