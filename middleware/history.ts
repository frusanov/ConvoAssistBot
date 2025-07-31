import type { Context, MiddlewareFn } from "telegraf";
import { message, editedMessage } from "telegraf/filters";
import { db } from "../lib/db";
import { messagesTable } from "../entities/message";
import { fromUnixTime } from "date-fns";
import { eq } from "drizzle-orm";

export const historyMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  if (!ctx.systems.chat.data.settings.saveHistory) return await next();

  const chatId = ctx.systems.chat.data.id;

  if (ctx.has(message("text"))) {
    await db.insert(messagesTable).values({
      chat: chatId,
      messageId: ctx.message.message_id,
      originalCreatedAt: fromUnixTime(ctx.message.date),
      data: ctx.message,
    });
  }

  if (ctx.has(editedMessage("text"))) {
    await db
      .update(messagesTable)
      .set({
        originalUpdatedAt: fromUnixTime(ctx.editedMessage.edit_date),
        data: ctx.editedMessage,
      })
      .where(eq(messagesTable.messageId, ctx.editedMessage.message_id));
  }

  await next();
};
