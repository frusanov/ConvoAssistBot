import type { Context, MiddlewareFn } from "telegraf";
import type { Message, Update } from "telegraf/types";
import { message, editedMessage } from "telegraf/filters";
import { db } from "../lib/db";
import { messagesTable } from "../entities/message";
import { fromUnixTime } from "date-fns";
import { eq } from "drizzle-orm";

declare module "../index" {
  interface SystemsContext {
    history: {
      storeMessage: (message: Message.TextMessage) => Promise<void>;
      updateMessage: (
        message: Message.TextMessage &
          Exclude<Context["editedMessage"], undefined>,
      ) => Promise<void>;
    };
  }
}

export const historyMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  const disableHistory =
    !ctx.systems.chat.data.settings.saveHistory || ctx.systems.command;

  const storeMessage = async (message: Message.TextMessage) => {
    if (disableHistory) return;

    await db.insert(messagesTable).values({
      chat: chatId,
      messageId: message.message_id,
      originalCreatedAt: fromUnixTime(message.date),
      data: message as Message.TextMessage,
    });
  };

  const updateMessage = async (
    message: Message.TextMessage & Exclude<Context["editedMessage"], undefined>,
  ) => {
    if (disableHistory) return;

    await db
      .update(messagesTable)
      .set({
        originalUpdatedAt: fromUnixTime(message.edit_date as number),
        data: message,
      })
      .where(eq(messagesTable.messageId, message.message_id));
  };

  ctx.systems.history = {
    storeMessage,
    updateMessage,
  };

  if (disableHistory) return await next();

  const chatId = ctx.systems.chat.data.id;

  if (ctx.has(message("text"))) {
    await storeMessage(ctx.message);
  }

  if (ctx.has(editedMessage("text"))) {
    await updateMessage(ctx.editedMessage);
  }

  await next();
};
