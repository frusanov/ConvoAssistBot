import { Telegraf } from "telegraf";
import { ignoreOldMessagesMiddleware } from "./middleware/ignore-old-messages";
import { contextCollectorMiddleware } from "./middleware/context-collector";
import { updateCommand } from "./commands/update";
import { adminGuardMiddleware } from "./middleware/admin-guard-middleware";

if (!process.env.BOT_TOKEN) throw new Error("BOT_TOKEN must be provided!");

export const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(ignoreOldMessagesMiddleware);
bot.use(contextCollectorMiddleware);

bot.command("update", adminGuardMiddleware, updateCommand);

bot.start((ctx) => ctx.reply("well cum"));
