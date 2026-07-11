import { Telegraf } from "telegraf";
import { ignoreOldMessagesMiddleware } from "./middleware/ignore-old-messages";
import { contextCollectorMiddleware } from "./middleware/context-collector";
import { commandMiddleware } from "./middleware/command";
import { historyMiddleware } from "./middleware/history";
import { transcribeMiddleware } from "./middleware/transcribe";
import { summaryMiddleware } from "./middleware/summary";

if (!process.env.BOT_TOKEN) throw new Error("BOT_TOKEN must be provided!");

export const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(ignoreOldMessagesMiddleware);
bot.use(contextCollectorMiddleware);
bot.use(commandMiddleware);
bot.use(historyMiddleware);
bot.use(transcribeMiddleware);
bot.use(summaryMiddleware);

bot.start((ctx) => ctx.reply("well cum"));

// /privacy command — link to Mini App
bot.command("privacy", async (ctx) => {
  await ctx.reply(
    `🔒 **Privacy Settings**\n\n` +
      `You can control your privacy here: https://t.me/ConvoAssistTestBot/app\n\n` +
      `Options: opt out per chat, opt out globally, delete your data.`,
    { parse_mode: "Markdown" },
  );
});

// New member notification
bot.on("chat_member", async (ctx) => {
  const update = ctx.update as any;
  const newMember = update.chat_member?.new_chat_member?.user;
  const status = update.chat_member?.new_chat_member?.status;

  if (newMember && status === "member") {
    await ctx.reply(
      `👋 Welcome! This bot stores messages to generate summaries. ` +
        `You can opt out anytime in settings: https://t.me/ConvoAssistTestBot/app`,
    );
  }
});
