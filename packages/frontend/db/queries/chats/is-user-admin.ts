import { db } from "@/db";
import { chatToUserJunctionTable } from "@/db/schema/chats.sql";
import { and, eq, or } from "drizzle-orm";

export async function isUserAdmin(chatUUID: string, userUUID: string) {
  const [record] = await db
    .select({
      id: chatToUserJunctionTable.id,
    })
    .from(chatToUserJunctionTable)
    .where(
      and(
        eq(chatToUserJunctionTable.chatId, chatUUID),
        eq(chatToUserJunctionTable.userId, userUUID),
        or(
          eq(chatToUserJunctionTable.role, "creator"),
          eq(chatToUserJunctionTable.role, "administrator"),
        ),
      ),
    );

  return Boolean(record);
}
