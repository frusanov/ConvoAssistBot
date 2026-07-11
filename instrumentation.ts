import { migrate } from "drizzle-orm/pglite/migrator";
import { db } from "./db";
import { bot, setupBot } from "./bot";

export async function register() {
  console.log("\nregister\n");
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Run DB migrations before starting the bot
    await migrate(db, { migrationsFolder: "./db/drizzle" });

    // Register commands and error handler
    await setupBot();

    if (bot.botInfo) return;

    try {
      await bot.launch();
      const username = bot.botInfo?.username ?? "?";
      console.log(`Bot started: @${username}`);
    } catch (err: any) {
      console.error(
        "Bot failed to start — check BOT_TOKEN in .env:",
        err?.message || err,
      );
    }
  }
}
