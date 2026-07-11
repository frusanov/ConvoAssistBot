import { validate } from "@tma.js/init-data-node";
import type { MiddlewareHandler } from "hono";

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const initialData = c.req.header("x-initial-data");

  try {
    if (!initialData || !process.env.BOT_TOKEN) {
      throw new Error("Missing bot token or initData");
    }

    validate(initialData, process.env.BOT_TOKEN);

    next();
  } catch (e) {
    return c.text("401: Unauthorized", {
      status: 401,
    });
  }
};
