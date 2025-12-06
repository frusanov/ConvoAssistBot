import { WithPagination } from "@/types/api";
import { API } from "..";

export async function listChats(this: API) {
  return await this.get<WithPagination>("/chats").then((r) => r.data);
}
