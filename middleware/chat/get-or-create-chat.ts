import type { Context } from "telegraf";
import { chatsTable, type ChatSelect } from "../../entities/chat";
import { db } from "../../lib/db";
import { eq } from "drizzle-orm";

export const getOrCreateChat = async (ctx: Context): Promise<ChatSelect> => {
  if (!ctx.chat?.id) {
    throw new Error("Chat ID is missing");
  }

  let [chat] = await db
    .select()
    .from(chatsTable)
    .where(eq(chatsTable.telegramChatId, ctx.chat.id));

  if (!chat) {
    chat = (
      await db
        .insert(chatsTable)
        .values({
          telegramChatId: ctx.chat.id,
          settings: {},
        })
        .returning()
    )[0];
  }

  return chat;
};
