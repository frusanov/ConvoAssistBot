import { createOrUpdateChatUser } from "./create-or-update-chat-user";
import { findOrCreateChat } from "./find-or-create-chat";
import { isUserAdmin } from "./is-user-admin";
import { updateChatAdminUsers } from "./update-admin-chat-users";
import { updateChatMeta } from "./update-chat-meta";

export const chatQueries = {
  createOrUpdateChatUser,
  findOrCreateChat,
  isUserAdmin,
  updateChatAdminUsers,
  updateChatMeta,
};
