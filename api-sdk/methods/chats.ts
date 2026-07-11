import { WithMeta, WithPagination } from "@/types/api";
import { API } from "..";
import { ChatSetings } from "@/types/chats";

export async function listChats(this: API) {
  return await this.get<WithPagination>("/chats").then((r) => r.data);
}

export async function getChat(this: API, id: string) {
  return await this.get<WithMeta<{ id: string; settings: ChatSetings }>>(
    `/chats/${id}`,
  ).then((r) => r.data);
}
