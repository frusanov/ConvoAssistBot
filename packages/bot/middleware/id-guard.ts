import type { Context, MiddlewareFn } from "telegraf";

if (!process.env.ADMIN_USERS) throw new Error("ADMIN_USERS must be provided!");
if (!process.env.ALLOWED_GROUPS)
  throw new Error("ALLOWED_GROUPS must be provided!");

function parseIdList(list: string): number[] {
  return list
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean)
    .map(Number);
}

const adminUsers = parseIdList(process.env.ADMIN_USERS);
const allowedGroups = parseIdList(process.env.ALLOWED_GROUPS);

const idsCombined = [...adminUsers, ...allowedGroups];

export const idGuardMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  if (!idsCombined.includes(ctx.chat?.id as number)) {
    return ctx.reply("You are not allowed to use this bot");
  }

  return next();
};
