import type { Chat } from "telegraf/types";
import { db } from "..";
import { eq } from "drizzle-orm";
import { createChatBalance, createUserBalance } from "./balance";
import { chatBalanceTable } from "../schema/balance.sql";
import { chatsTable } from "../schema/chats.sql";

export async function findOrCreateChat(tgChat: Pick<Chat, "id" | "type">) {
  const chatSelection = {
    id: chatsTable.id,
    tgId: chatsTable.tgId,
    createdAt: chatsTable.createdAt,
    updatedAt: chatsTable.updatedAt,
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
    const balance = await createChatBalance();

    chat = {
      ...(
        await db
          .insert(chatsTable)
          .values({
            tgId: tgChat.id,
            balanceId: balance.id,
            type: tgChat.type === "private" ? "private" : "group",
          })
          .returning({
            ...chatSelection,
          })
      )[0],
      balance,
    };
  }

  return chat;
}
