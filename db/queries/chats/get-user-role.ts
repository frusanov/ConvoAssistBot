import { db } from "@/db";
import { chatToUserJunctionTable } from "@/db/schema/chats.sql";
import { and, eq } from "drizzle-orm";

export async function getUserRole(chatId: string, userId: string) {
  const [row] = await db
    .select()
    .from(chatToUserJunctionTable)
    .where(
      and(
        eq(chatToUserJunctionTable.chatId, chatId),
        eq(chatToUserJunctionTable.userId, userId),
      ),
    );

  return row ?? null;
}
