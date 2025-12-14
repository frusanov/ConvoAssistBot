import { db } from "@/db";
import { chatBalanceTable } from "@/db/schema/balance.sql";
import { chatsTable } from "@/db/schema/chats.sql";
import { eq } from "drizzle-orm";
import { createChatBalance } from "../balance";
import { updateChatAdminUsers } from "./update-admin-chat-users";
import { TelegramChat } from "@/types/telegram";
import { getChatTitle } from "@/lib/get-chat-title";

export async function findOrCreateChat(tgChat: TelegramChat) {
  const chatSelection = {
    id: chatsTable.id,
    tgId: chatsTable.tgId,
    createdAt: chatsTable.createdAt,
    updatedAt: chatsTable.updatedAt,
    type: chatsTable.type,
  };

  let [chat] = await db
    .select({
      ...chatSelection,
      balance: chatBalanceTable,
    })
    .from(chatsTable)
    .leftJoin(chatBalanceTable, eq(chatsTable.balanceId, chatBalanceTable.id))
    .where(eq(chatsTable.tgId, tgChat.id));

  if (!chat) {
    chat = await db.transaction(async (tx) => {
      const balance = await createChatBalance(tx);

      return {
        ...(
          await tx
            .insert(chatsTable)
            .values({
              tgId: tgChat.id,
              title: getChatTitle(tgChat),
              balanceId: balance.id,
              type: tgChat.type === "private" ? "private" : "group",
            })
            .returning({
              ...chatSelection,
            })
        )[0],
        balance,
      };
    });

    if (chat.type === "group") {
      await updateChatAdminUsers(chat);
    }
  }

  return chat;
}
