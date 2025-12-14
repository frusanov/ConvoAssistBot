import type { Context } from "telegraf";
import { scenesTable, type ScenesSelect } from "../../entities/scene";
import { db } from "../../lib/db";
import { eq } from "drizzle-orm";

export const getOrCreateScene = async (ctx: Context) => {
  let [scene] = await db
    .select()
    .from(scenesTable)
    .where(eq(scenesTable.chat, ctx.systems.chat.data.id));

  if (!scene) {
    scene = (
      await db
        .insert(scenesTable)
        .values({
          chat: ctx.systems.chat.data.id,
          scene: "default",
          context: {},
        })
        .returning()
    )[0];
  }

  return scene as Pick<ScenesSelect, "id" | "chat" | "scene" | "context">;
};
