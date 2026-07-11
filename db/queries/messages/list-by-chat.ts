import { db } from "@/db";
import { messagesTable } from "@/db/schema/messages.sql";
import { eq, desc } from "drizzle-orm";

export async function listMessagesByChat(chatId: string, limit: number = 100) {
  return await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.chatId, chatId))
    .orderBy(desc(messagesTable.originalCreatedAt))
    .limit(limit);
}
