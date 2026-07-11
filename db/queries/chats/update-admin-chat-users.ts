import { bot } from "@/bot";
import { createOrUpdateChatUser } from "./create-or-update-chat-user";
import { findOrCreateChat } from "./find-or-create-chat";
import { findOrCreateUser } from "../users/find-or-create-user";

export async function updateChatAdminUsers(
  chat: Awaited<ReturnType<typeof findOrCreateChat>>,
) {
  const admins = await bot.telegram.getChatAdministrators(chat.tgId);

  const adminUsers = await Promise.all(
    admins.map(({ user, status }) => {
      return findOrCreateUser(user).then((userData) => ({
        user: userData,
        status,
      }));
    }),
  );

  await Promise.all(
    adminUsers.map(({ user, status }) => {
      return createOrUpdateChatUser(chat.id, user.id, status);
    }),
  );
}
