import { db } from "@/db";
import { chatsTable } from "@/db/schema/chats.sql";
import { getChatTitle } from "@/lib/get-chat-title";
import { TelegramChat } from "@/types/telegram";
import { updateChatAdminUsers } from "./update-admin-chat-users";

export async function updateChatMeta(tgChat: TelegramChat) {
  const [chat] = await db
    .update(chatsTable)
    .set({
      title: getChatTitle(tgChat),
    })
    .returning();

  if (chat.type === "private") {
    await updateChatAdminUsers(chat);
  }
}
