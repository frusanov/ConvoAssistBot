import type { Context, MiddlewareFn } from "telegraf";
import { getOrCreateChat } from "./get-or-create-chat";
import type { ChatSelect } from "../../entities/chat";
import { updateSettings } from "./update-settings";

declare module "../../index" {
  interface SystemsContext {
    chat: {
      data: ChatSelect;
      updateSettings: typeof updateSettings;
    };
  }
}

export const chatMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  if (typeof ctx.chat?.id === "undefined") {
    return next();
  }

  const chat = await getOrCreateChat(ctx);

  if (!ctx.systems) {
    // @ts-ignore
    ctx.systems = {};
  }

  ctx.systems.chat = {
    data: chat,
    updateSettings: updateSettings.bind(ctx),
  };

  return next();
};
