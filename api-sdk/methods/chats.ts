import type { WithMeta, WithPagination } from "@/types/api";
import type { API } from "..";
import type { ChatSetings } from "@/types/chats";

export async function listChats(this: API) {
  return await this.get<WithPagination>("/chats").then((r) => r.data);
}

export async function getChat(this: API, id: string) {
  return await this.get<WithMeta<{ id: string; settings: ChatSetings }>>(
    `/chats/${id}`,
  ).then((r) => r.data);
}

export async function updateChatSettings(this: API, id: string, settings: Partial<ChatSetings>) {
  return await this.patch<WithMeta<ChatSetings>>(
    `/chats/${id}/settings`,
    settings,
  ).then((r) => r.data);
}

export async function getMyChatUserData(this: API, chatId: string) {
  return await this.get<WithMeta<{ role: string; optedOut: boolean } | null>>(
    `/chats/${chatId}/users/me`,
  ).then((r) => r.data);
}

export async function updateMyChatOptOut(this: API, chatId: string, optedOut: boolean) {
  return await this.patch<{ success: boolean }>(
    `/chats/${chatId}/users/me`,
    { optedOut },
  ).then((r) => r.data);
}

export async function deleteChatMessages(this: API, chatId: string) {
  return await this.delete<{ success: boolean }>(
    `/chats/${chatId}/messages`,
  ).then((r) => r.data);
}
