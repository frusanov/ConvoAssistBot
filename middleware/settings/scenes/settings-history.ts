import type { Context, MiddlewareFn } from "telegraf";
import { getConfirmMarkup } from "../../../lib/get-confirm-markup";

export const settingsHistorySceneMiddleware: MiddlewareFn<Context> = async (
  ctx,
  next,
) => {
  if (ctx.callbackQueryData?.kind === "confirmSaveHistory") {
    await ctx.systems.chat.updateSettings({
      saveHistory: true,
      historyDateLimit: 3600 * 24 * 3,
      historySizeLimit: 3000,
    });
    await ctx.systems.scene.resetScene();
  }

  if (ctx.callbackQueryData?.kind === "denySaveHistory") {
    await ctx.systems.chat.updateSettings({
      saveHistory: false,
    });
    await ctx.systems.scene.resetScene();
  }

  if (ctx.systems.scene.data.scene === "settings-history") {
    await ctx.reply(
      `Whant to save history? Current setting is "${ctx.systems.chat.data.settings.saveHistory ? "enabled" : "disabled"}"`,
      getConfirmMarkup(
        { kind: "confirmSaveHistory", text: "Enable" },
        { kind: "denySaveHistory", text: "Disable" },
      ),
    );
  }

  await next();
};
