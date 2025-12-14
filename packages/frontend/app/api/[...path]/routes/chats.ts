import { Hono } from "hono";
import { jwtAuthMiddleware } from "../middleware/jwt-auth-middleware";
import { WithPagination } from "@/types/api";
import { db } from "@/db";
import { chatsTable, chatToUserJunctionTable } from "@/db/schema/chats.sql";
import { and, eq, or } from "drizzle-orm";
import { chatBalanceTable } from "@/db/schema/balance.sql";

export const chats = new Hono();

chats.use(jwtAuthMiddleware);

chats.get("/:id", async (c) => {
  if (!c.userId) throw new Error("Unauthorized");

  const [chat] = await db
    .select({
      id: chatsTable.id,
      title: chatsTable.title,
      type: chatsTable.type,
      settings: chatsTable.settings,
      balance: {
        points: chatBalanceTable.points,
        tariff: chatBalanceTable.tariff,
      },
    })
    .from(chatToUserJunctionTable)
    .leftJoin(chatsTable, eq(chatToUserJunctionTable.chatId, chatsTable.id))
    .leftJoin(chatBalanceTable, eq(chatsTable.balanceId, chatBalanceTable.id))
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

  console.log({ chat });

  if (!chat) {
    return c.json(
      {
        detail: "Not found",
      },
      {
        status: 404,
      },
    );
  }

  return c.json({
    data: chat,
  });
});

chats.get("/", async (c) => {
  if (!c.userId) throw new Error("Unauthorized");

  const limit = parseInt(c.req.query("limit") as string) || 10;
  const offset = parseInt(c.req.query("offset") as string) || 0;

  const chats = await db
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
    data: chats.map(({ chat }) => chat!),
    meta: {
      limit,
      offset,
    },
  } satisfies WithPagination);
});
