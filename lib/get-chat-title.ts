import { TelegramChat } from "@/types/telegram";

export function getChatTitle(chat: TelegramChat) {
  if (chat.title) return chat.title;
  if (chat.first_name || chat.last_name) {
    return [chat.first_name, chat.last_name].filter(Boolean).join(" ");
  }
  if (chat.username) return chat.username;
  return null;
}
