import { updateChatMeta } from "@/db/queries/chats/update-chat-meta";
import { CommandHandler } from "../types";

export const updateCommand: CommandHandler = async (c) => {
  await updateChatMeta(c.chat);
  c.reply("update");
};
