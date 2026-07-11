import { storeMessage } from "./store-message";
import { listMessagesByChat } from "./list-by-chat";
import { deleteMessagesByUser } from "./delete-by-user";
import { deleteMessagesByChat } from "./delete-by-chat";

export const messageQueries = {
  storeMessage,
  listMessagesByChat,
  deleteMessagesByUser,
  deleteMessagesByChat,
};
