import { migrate } from "drizzle-orm/pglite/migrator";
import { db } from "./db";
import { bot, setupBot } from "./bot";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Run DB migrations before starting the bot
    await migrate(db, { migrationsFolder: "./db/drizzle" });

    // Register commands and error handler
    await setupBot();

    // Pre-fetch bot info so we can log the username before launching.
    bot.botInfo ??= await bot.telegram.getMe();
    const botUsername = bot.botInfo?.username ?? "?";

    // bot.launch() with long polling starts an infinite polling loop
    // that never resolves — do NOT await it, fire and forget.
    // Errors during polling are caught by the .catch() handler.
    bot.launch().catch((err: Error) => {
      console.error("Bot polling error:", err?.message || err);
    });

    console.log(`Bot started: @${botUsername}`);
  }
}
