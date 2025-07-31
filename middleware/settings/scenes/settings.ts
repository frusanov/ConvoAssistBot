import type { Context, MiddlewareFn } from "telegraf";
import { getConfirmMarkup } from "../../../lib/get-confirm-markup";

export const settingsSceneMiddleware: MiddlewareFn<Context> = async (
  ctx,
  next,
) => {
  if (ctx.isSettingsCommand && ctx.systems.scene.data.scene === "default") {
    await ctx.systems.scene.setScene("settings-main");
  }

  if (ctx.callbackQueryData?.kind === "confirmChangeSettings") {
    await ctx.systems.scene.setScene("settings-history");
  }

  if (ctx.callbackQueryData?.kind === "exitSettings") {
    await ctx.systems.scene.setScene("default");
  }

  if (ctx.systems.scene.data.scene === "settings-main") {
    await ctx.reply(
      "Do you want to change settings?",
      getConfirmMarkup(
        { kind: "confirmChangeSettings" },
        { kind: "exitSettings" },
      ),
    );
  }

  await next();
};
