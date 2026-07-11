import type { Context, MiddlewareFn } from "telegraf";
import { message } from "telegraf/filters";
import { messageQueries } from "@/db/queries/messages";
import { chatToUserJunctionTable } from "@/db/schema/chats.sql";
import { db } from "@/db";
import { and, eq } from "drizzle-orm";
import type { UserPrivacySettings } from "@/db/schema/users.sql";

export const historyMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  if (!ctx.userData || !ctx.chatData) return next();

  const chat = ctx.chatData;
  const user = ctx.userData;
  const chatSettings = chat.settings as {
    summarize?: boolean;
    storeMessages?: { amount: number; time: number };
  };

  if (!chatSettings.summarize) return await next();

  if (ctx.has(message("text")) && !ctx.systems.command) {
    const privacy = user.privacySettings as UserPrivacySettings;

    // Check global opt-out
    if (privacy.globallyOptedOut) {
      await messageQueries.storeMessage({
        tgMessage: ctx.message,
        chatId: chat.id,
        userId: user.id,
        chatTgId: chat.tgId,
        userTgId: ctx.message.from?.id ?? null,
        isHiddenForPrivacy: true,
      });
      return await next();
    }

    // Check per-chat opt-out
    const [junction] = await db
      .select()
      .from(chatToUserJunctionTable)
      .where(
        and(
          eq(chatToUserJunctionTable.chatId, chat.id),
          eq(chatToUserJunctionTable.userId, user.id),
        ),
      );

    const isOptedOut = junction?.optedOut ?? false;

    await messageQueries.storeMessage({
      tgMessage: ctx.message,
      chatId: chat.id,
      userId: user.id,
      chatTgId: chat.tgId,
      userTgId: ctx.message.from?.id ?? null,
      isHiddenForPrivacy: isOptedOut,
    });
  }

  await next();
};
