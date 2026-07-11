import { chatQueries } from "@/db/queries";
import { Context, MiddlewareFn } from "telegraf";

export const adminGuardMiddleware: MiddlewareFn<Context> = async (
  ctx,
  next,
) => {
  const chat = ctx.chatData;
  const user = ctx.userData;

  if (!(await chatQueries.isUserAdmin(chat.id, user.id))) {
    ctx.reply("You must be an admin to use this command.");
    return;
  }

  return next();
};
