import { bot } from "..";

export type CommandHandler = Parameters<typeof bot.command>[1];
