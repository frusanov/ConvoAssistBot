import { Context, type MiddlewareFn } from "telegraf";
import { settingsSceneMiddleware } from "./scenes/settings";
import { settingsHistorySceneMiddleware } from "./scenes/settings-history";

declare module "telegraf" {
  interface Context {
    isSettingsCommand?: boolean;
  }
}

export const mainSettingsMiddleware: MiddlewareFn<Context> = async (
  ctx,
  next,
) => {
  const isSettingsCommand = ctx
    .entities("bot_command")
    .some((item) => item.fragment === "/settings");

  ctx.isSettingsCommand = isSettingsCommand;

  console.log({ isSettingsCommand });

  return next();
};

export const settingsMiddlewares = [
  mainSettingsMiddleware,
  settingsSceneMiddleware,
  settingsHistorySceneMiddleware,
];
