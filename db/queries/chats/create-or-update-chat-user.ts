import { db } from "@/db";
import {
  chatToUserJunctionTable,
  chatUserRoleEnum,
} from "@/db/schema/chats.sql";
import type { InferEnum } from "drizzle-orm";

export async function createOrUpdateChatUser(
  chatUUID: string,
  userUUID: string,
  role: InferEnum<typeof chatUserRoleEnum> = "member",
) {
  const [junction] = await db
    .insert(chatToUserJunctionTable)
    .values({
      chatId: chatUUID,
      userId: userUUID,
      role,
    })
    .onConflictDoUpdate({
      target: [chatToUserJunctionTable.chatId, chatToUserJunctionTable.userId],
      set: {
        role,
        updatedAt: new Date(),
      },
    })
    .returning();

  return junction;
}
