import { type MiddlewareFn, type Context } from "telegraf";

export const responseTimeMiddleware: MiddlewareFn<Context> = async (
  ctx,
  next,
) => {
  const start = Date.now();
  await next();
  const end = Date.now();
  console.log(`Response time: ${end - start}ms`);
};
