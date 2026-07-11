import { findOrCreateChat } from "./find-or-create-chat";
import { updateChatSettings } from "./update-settings";
import { isUserAdmin } from "./is-user-admin";
import { getUserRole } from "./get-user-role";
import { updateChatMeta } from "./update-chat-meta";
import { createOrUpdateChatUser } from "./create-or-update-chat-user";

export const chatQueries = {
  findOrCreateChat,
  updateChatSettings,
  isUserAdmin,
  getUserRole,
  updateChatMeta,
  createOrUpdateChatUser,
};
