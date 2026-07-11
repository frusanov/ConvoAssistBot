import { db } from "@/db";
import { chatsTable } from "@/db/schema/chats.sql";
import { eq } from "drizzle-orm";
import { getChatTitle } from "@/lib/get-chat-title";
import { updateChatAdminUsers } from "./update-admin-chat-users";
import type { Chat } from "telegraf/types";

export async function updateChatMeta(tgChat: Chat) {
  const [chat] = await db
    .update(chatsTable)
    .set({
      title: getChatTitle(tgChat as any),
    })
    .where(eq(chatsTable.tgId, tgChat.id))
    .returning();

  if (chat && chat.type === "private") {
    await updateChatAdminUsers(chat);
  }
}
