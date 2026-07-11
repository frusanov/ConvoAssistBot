import { db } from "@/db";
import { chatsTable } from "@/db/schema/chats.sql";
import { eq } from "drizzle-orm";
import type { Chat } from "telegraf/types";
import { getChatTitle } from "@/lib/get-chat-title";

export async function findOrCreateChat(tgChat: Chat) {
  let [chat] = await db
    .select()
    .from(chatsTable)
    .where(eq(chatsTable.tgId, tgChat.id));

  if (!chat) {
    [chat] = await db
      .insert(chatsTable)
      .values({
        tgId: tgChat.id,
        title: getChatTitle(tgChat as any),
        type:
          tgChat.type === "group" || tgChat.type === "supergroup"
            ? "group"
            : "private",
      })
      .returning();
  }

  return chat;
}
