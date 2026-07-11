import { Hono } from "hono";
import { jwtAuthMiddleware } from "../middleware/jwt-auth-middleware";
import type { WithPagination } from "@/types/api";
import { db } from "@/db";
import { chatsTable, chatToUserJunctionTable } from "@/db/schema/chats.sql";
import { and, eq, or } from "drizzle-orm";
import { chatQueries } from "@/db/queries";
import { messageQueries } from "@/db/queries/messages";

export const chats = new Hono();

chats.use(jwtAuthMiddleware);

// GET /chats/:id — get chat details with settings
chats.get("/:id", async (c) => {
  if (!c.userId) throw new Error("Unauthorized");

  const [chat] = await db
    .select({
      id: chatsTable.id,
      tgId: chatsTable.tgId,
      title: chatsTable.title,
      type: chatsTable.type,
      settings: chatsTable.settings,
      createdAt: chatsTable.createdAt,
      updatedAt: chatsTable.updatedAt,
    })
    .from(chatToUserJunctionTable)
    .leftJoin(chatsTable, eq(chatToUserJunctionTable.chatId, chatsTable.id))
    .where(
      and(
        eq(chatToUserJunctionTable.userId, c.userId),
        eq(chatToUserJunctionTable.chatId, c.req.param("id")),
        or(
          eq(chatToUserJunctionTable.role, "administrator"),
          eq(chatToUserJunctionTable.role, "creator"),
        ),
      ),
    );

  if (!chat) {
    return c.json({ detail: "Not found" }, 404);
  }

  return c.json({ data: chat });
});

// GET /chats — list user's chats
chats.get("/", async (c) => {
  if (!c.userId) throw new Error("Unauthorized");

  const limit = parseInt(c.req.query("limit") as string) || 10;
  const offset = parseInt(c.req.query("offset") as string) || 0;

  const rows = await db
    .select({
      id: chatToUserJunctionTable.id,
      userId: chatToUserJunctionTable.userId,
      chatId: chatToUserJunctionTable.chatId,
      chat: {
        id: chatsTable.id,
        title: chatsTable.title,
        type: chatsTable.type,
        createdAt: chatsTable.createdAt,
        updatedAt: chatsTable.updatedAt,
      },
    })
    .from(chatToUserJunctionTable)
    .leftJoin(chatsTable, eq(chatToUserJunctionTable.chatId, chatsTable.id))
    .where(
      and(
        eq(chatToUserJunctionTable.userId, c.userId),
        or(
          eq(chatToUserJunctionTable.role, "administrator"),
          eq(chatToUserJunctionTable.role, "creator"),
        ),
      ),
    )
    .limit(limit)
    .offset(offset);

  return c.json({
    data: rows.map((r) => r.chat!),
    meta: { limit, offset },
  } satisfies WithPagination);
});

// PATCH /chats/:id/settings — update chat settings (admin only)
chats.patch("/:id/settings", async (c) => {
  if (!c.userId) throw new Error("Unauthorized");

  const role = await chatQueries.getUserRole(c.req.param("id"), c.userId);
  if (!role || (role.role !== "administrator" && role.role !== "creator")) {
    return c.json({ error: "Admin access required" }, 403);
  }

  const body = await c.req.json();
  const updated = await chatQueries.updateChatSettings(c.req.param("id"), body);
  return c.json({ data: updated.settings });
});

// GET /chats/:id/users/me — get user's junction data for this chat
chats.get("/:id/users/me", async (c) => {
  if (!c.userId) throw new Error("Unauthorized");

  const row = await chatQueries.getUserRole(c.req.param("id"), c.userId);
  return c.json({ data: row });
});

// PATCH /chats/:id/users/me — toggle opt-out
chats.patch("/:id/users/me", async (c) => {
  if (!c.userId) throw new Error("Unauthorized");

  const body = await c.req.json();

  await db
    .update(chatToUserJunctionTable)
    .set({ optedOut: body.optedOut })
    .where(
      and(
        eq(chatToUserJunctionTable.chatId, c.req.param("id")),
        eq(chatToUserJunctionTable.userId, c.userId),
      ),
    );

  return c.json({ success: true });
});

// DELETE /chats/:id/messages — delete all chat messages (admin only)
chats.delete("/:id/messages", async (c) => {
  if (!c.userId) throw new Error("Unauthorized");

  const role = await chatQueries.getUserRole(c.req.param("id"), c.userId);
  if (!role || (role.role !== "administrator" && role.role !== "creator")) {
    return c.json({ error: "Admin access required" }, 403);
  }

  await messageQueries.deleteMessagesByChat(c.req.param("id"));
  return c.json({ success: true });
});
