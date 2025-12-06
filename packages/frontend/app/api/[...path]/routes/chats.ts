import { Hono } from "hono";
import { jwtAuthMiddleware } from "../middleware/jwt-auth-middleware";

export const chats = new Hono();

chats.use(jwtAuthMiddleware);

chats.get("/", (c) => {
  return c.json({
    message: "Hello Next.js!",
  });
});
