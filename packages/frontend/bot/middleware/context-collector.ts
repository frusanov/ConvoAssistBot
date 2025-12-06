import { findOrCreateChat } from "@/db/queries/chats";
import { findOrCreateUser } from "@/db/queries/users";
import type { Context, MiddlewareFn } from "telegraf";

declare module "telegraf" {
  interface Context {
    userData: Awaited<ReturnType<typeof findOrCreateUser>>;
    chatData: Awaited<ReturnType<typeof findOrCreateChat>>;
  }
}

export const contextCollectorMiddleware: MiddlewareFn<Context> = async (
  ctx,
  next,
) => {
  const tgUser = ctx.message?.from;
  const tgChat = ctx.chat;

  if (!tgUser) throw new Error("User not provided");
  if (!tgChat) throw new Error("Chat not provided");

  const [user, chat] = await Promise.all([
    findOrCreateUser(tgUser),
    findOrCreateChat(tgChat),
  ]);

  ctx.userData = user;
  ctx.chatData = chat;

  return next();
};
