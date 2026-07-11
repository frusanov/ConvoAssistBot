import { db } from "@/db";
import { messagesTable } from "@/db/schema/messages.sql";
import { eq } from "drizzle-orm";

export async function deleteMessagesByChat(chatId: string) {
  return await db
    .delete(messagesTable)
    .where(eq(messagesTable.chatId, chatId));
}
