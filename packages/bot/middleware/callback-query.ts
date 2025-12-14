import type { Context, MiddlewareFn } from "telegraf";
import type { CallbackQuery } from "../types";

declare module "telegraf" {
  interface Context {
    callbackQueryData?: CallbackQuery | null;
  }
}

export const callbackQueryMiddleware: MiddlewareFn<Context> = async (
  ctx,
  next,
) => {
  if (ctx.has("callback_query")) {
    try {
      // @ts-ignore
      const data = JSON.parse(ctx.callbackQuery.data) as CallbackQuery;

      await ctx.telegram.editMessageReplyMarkup(
        ctx.chat!.id,
        ctx.callbackQuery.message?.message_id,
        undefined,
        {
          inline_keyboard: [],
        },
      );

      ctx.callbackQueryData = data;
    } catch {
      ctx.callbackQueryData = null;
    }
  }

  await next();
};
