import { isUserAdmin } from "@/db/queries/chats/is-user-admin";
import { Context, MiddlewareFn } from "telegraf";

export const adminGuardMiddleware: MiddlewareFn<Context> = async (
  ctx,
  next,
) => {
  const chat = ctx.chatData;
  const user = ctx.userData;

  if (!(await isUserAdmin(chat.id, user.id))) {
    ctx.reply("You must be an admin to use this command.");
    return;
  }

  return next();
};
