import type { Context, MiddlewareFn } from "telegraf";
import { eq } from "drizzle-orm";
import { getOrCreateScene } from "./get-or-create-scene";
import { scenesTable, type SceneKind } from "../../entities/scene";
import { db } from "../../lib/db";

export async function resetScene(this: Context) {
  const sceneId = this.systems.scene.data.id;

  const [result] = await db
    .update(scenesTable)
    .set({
      scene: "default",
      context: {},
    })
    .where(eq(scenesTable.id, sceneId))
    .returning();

  this.systems.scene.data = result;
}
