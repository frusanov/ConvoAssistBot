import { Chat } from "telegraf/types";

export type TelegramChat = Chat.AbstractChat &
  Chat.TitleChat &
  Chat.UserNameChat &
  Partial<Pick<Chat.PrivateChat, "first_name" | "last_name">>;
