import type { Chat } from "telegraf/types";

export function getChatTitle(chat: Chat) {
  if ("title" in chat && chat.title) return chat.title;
  if ("first_name" in chat) {
    const name = [chat.first_name, (chat as any).last_name]
      .filter(Boolean)
      .join(" ");
    if (name) return name;
  }
  if ("username" in chat && chat.username) return chat.username;
  return null;
}
