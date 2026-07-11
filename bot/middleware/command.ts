import type { Context, MiddlewareFn } from "telegraf";
import { message } from "telegraf/filters";

export const commandMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  ctx.systems.command = null;

  const commands = ctx.entities("bot_command");
  const command = commands[0];

  if (!command || !ctx.has(message("text"))) return await next();

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
