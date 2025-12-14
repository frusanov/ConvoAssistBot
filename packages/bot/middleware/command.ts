import type { Context } from "telegraf";
import type { MiddlewareFn } from "telegraf";
import { message } from "telegraf/filters";

declare module "../index" {
  interface SystemsContext {
    command: {
      name: string;
      args: string[];
    } | null;
  }
}

export const commandMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  ctx.systems.command = null;

  const command = ctx.entities("bot_command")[0];

  if (!command.length || !ctx.has(message("text"))) return await next();

  const args = ctx.message.text
    .slice(command.offset + command.length)
    .split(" ")
    .map((arg) => arg.trim())
    .filter(Boolean);

  ctx.systems.command = {
    name: command.fragment.slice(1),
    args,
  };

  await next();
};
