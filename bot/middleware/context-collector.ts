import { chatQueries, userQueries } from "@/db/queries";
import type { Context, MiddlewareFn } from "telegraf";

declare module "telegraf" {
  interface Context {
    userData: Awaited<ReturnType<typeof userQueries.findOrCreateUser>>;
    chatData: Awaited<ReturnType<typeof chatQueries.findOrCreateChat>>;
    systems: {
      command: { name: string; args: string[] } | null;
    };
  }
}

export const contextCollectorMiddleware: MiddlewareFn<Context> = async (
  ctx,
  next,
) => {
  const tgUser = ctx.from;
  const tgChat = ctx.chat;

  if (!tgUser) {
    // Updates without user context (e.g., channel posts, boosts, message reactions)
    // are not relevant for this bot — skip context collection gracefully
    console.warn(`Skipping context collection for ${ctx.updateType} (no user)`);
    ctx.systems = { command: null };
    return next();
  }
  if (!tgChat) throw new Error("Chat not provided");

  const [user, chat] = await Promise.all([
    userQueries.findOrCreateUser(tgUser),
    chatQueries.findOrCreateChat(tgChat),
  ]);

  ctx.userData = user;
  ctx.chatData = chat;
  ctx.systems = { command: null };

  return next();
};
