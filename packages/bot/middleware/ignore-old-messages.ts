import type { Context, MiddlewareFn } from "telegraf";

export const ignoreOldMessagesMiddleware: MiddlewareFn<Context> = async (
  ctx,
  next,
) => {
  if (
    ctx.message?.date &&
    new Date().getTime() / 1000 - ctx.message.date > 60
  ) {
    return;
  }
  return next();
};
