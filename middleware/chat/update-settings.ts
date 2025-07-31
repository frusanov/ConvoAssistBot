import type { Context } from "telegraf";
import { chatsTable, type ChatSelect } from "../../entities/chat";
import { db } from "../../lib/db";

export async function updateSettings(
  this: Context,
  settings: Partial<ChatSelect["settings"]>,
) {
  const _settings = this.systems.chat.data.settings;

  this.systems.chat.data = (
    await db
      .update(chatsTable)
      .set({
        settings: {
          ..._settings,
          ...settings,
        },
      })
      .returning()
  )[0];
}
