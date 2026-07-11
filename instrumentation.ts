export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Dynamic imports keep Node.js-only modules (node:fs, PGlite, Telegraf)
    // out of the Edge Runtime's static analysis.
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    const { db } = await import("./db");
    const { bot, setupBot } = await import("./bot");

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
