import { Telegraf } from "telegraf";
import { responseTimeMiddleware } from "./middleware/response-time";
import { idGuardMiddleware } from "./middleware/id-guard";
import { ignoreOldMessagesMiddleware } from "./middleware/ignore-old-messages";
import { transcribeMiddleware } from "./middleware/transcribe";
import { settingsMiddlewares } from "./middleware/settings";
import { sceneMiddleware } from "./middleware/scene";
import { chatMiddleware } from "./middleware/chat";
import { callbackQueryMiddleware } from "./middleware/callback-query";
import { historyMiddleware } from "./middleware/history";
import { summaryMiddleware } from "./middleware/summary";
import { commandMiddleware } from "./middleware/command";

export interface SystemsContext {}

declare module "telegraf" {
  interface Context {
    systems: SystemsContext;
  }
}

if (!process.env.BOT_TOKEN) throw new Error("BOT_TOKEN must be provided!");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply("well cum"));

bot.use(ignoreOldMessagesMiddleware);
bot.use(responseTimeMiddleware);
bot.use(idGuardMiddleware);
bot.use(callbackQueryMiddleware);
bot.use(chatMiddleware);
bot.use(commandMiddleware);
bot.use(historyMiddleware);
bot.use(sceneMiddleware);
bot.use(...settingsMiddlewares);
bot.use(summaryMiddleware);
bot.use(transcribeMiddleware);

bot.launch();

// Enable graceful stop
process.once("SIGINT", bot.stop);
process.once("SIGTERM", bot.stop);
