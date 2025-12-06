import { bot } from "./bot";

export async function register() {
  console.log("\nregister\n");
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (bot.botInfo) return;
    bot.launch();
  }
}
