import { Hono } from "hono";
import { jwtAuthMiddleware } from "../middleware/jwt-auth-middleware";
import { userQueries } from "@/db/queries";
import { messageQueries } from "@/db/queries/messages";

export const privacy = new Hono();

privacy.use(jwtAuthMiddleware);

// GET /api/privacy/me — get user privacy settings
privacy.get("/me", async (c) => {
  if (!c.userId) throw new Error("Unauthorized");

  const user = await userQueries.findById(c.userId);
  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json({ data: user.privacySettings });
});

// PATCH /api/privacy/me — update global opt-out
privacy.patch("/me", async (c) => {
  if (!c.userId) throw new Error("Unauthorized");

  const body = await c.req.json();
  const updated = await userQueries.updatePrivacySettings(c.userId, body);
  return c.json({ data: updated?.privacySettings });
});

// DELETE /api/privacy/me/messages — delete all my messages
privacy.delete("/me/messages", async (c) => {
  if (!c.userId) throw new Error("Unauthorized");

  await messageQueries.deleteMessagesByUser(c.userId);
  return c.json({ success: true });
});
