import { db } from "@/db";
import { chatsTable } from "@/db/schema/chats.sql";
import { eq } from "drizzle-orm";
import type { ChatSetings } from "@/types/chats";

export async function updateChatSettings(
  chatId: string,
  settings: Partial<ChatSetings>,
) {
  const chat = await db
    .select()
    .from(chatsTable)
    .where(eq(chatsTable.id, chatId))
    .then((r) => r[0]);

  if (!chat) throw new Error("Chat not found");

  const merged = { ...(chat.settings as ChatSetings), ...settings };

  return await db
    .update(chatsTable)
    .set({ settings: merged })
    .where(eq(chatsTable.id, chatId))
    .returning()
    .then((r) => r[0]);
}
