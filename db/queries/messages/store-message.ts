import { db } from "@/db";
import { messagesTable } from "@/db/schema/messages.sql";
import { fromUnixTime } from "date-fns";
import type { Message } from "telegraf/types";

interface StoreMessageParams {
  tgMessage: Message.TextMessage;
  chatId: string;
  userId: string;
  chatTgId: number;
  userTgId: number | null;
  isHiddenForPrivacy?: boolean;
}

export async function storeMessage(params: StoreMessageParams) {
  return await db
    .insert(messagesTable)
    .values({
      tgId: params.tgMessage.message_id,
      chatId: params.chatId,
      userId: params.userId,
      chatTgId: params.chatTgId,
      userTgId: params.userTgId,
      text: params.isHiddenForPrivacy ? null : params.tgMessage.text,
      isHiddenForPrivacy: params.isHiddenForPrivacy ?? false,
      originalCreatedAt: fromUnixTime(params.tgMessage.date),
    })
    .returning()
    .then((r) => r[0]);
}
