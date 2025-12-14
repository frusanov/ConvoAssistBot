import type { Context, MiddlewareFn } from "telegraf";
import { getOrCreateScene } from "./get-or-create-scene";
import { setScene } from "./set-scene";
import { resetScene } from "./reset-scene";

declare module "../../index" {
  interface SystemsContext {
    scene: {
      data: Awaited<ReturnType<typeof getOrCreateScene>>;
      setScene: typeof setScene;
      resetScene: typeof resetScene;
    };
  }
}

export const sceneMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  const scene = await getOrCreateScene(ctx);

  ctx.systems.scene = {
    data: scene,
    setScene: setScene.bind(ctx),
    resetScene: resetScene.bind(ctx),
  };

  const isResetCommand = ctx
    .entities()
    .some((item) => item.type === "bot_command" && item.fragment === "/reset");

  if (isResetCommand) {
    await ctx.systems.scene.resetScene();
  }

  return next();
};
