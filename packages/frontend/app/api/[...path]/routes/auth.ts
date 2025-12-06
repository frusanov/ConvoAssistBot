import { Hono } from "hono";
import { validate, parse } from "@tma.js/init-data-node";
import * as jose from "jose";
import { findOrCreateUser } from "@/db/queries/users";
import { jwtSecret } from "../middleware/jwt-auth-middleware";

export const auth = new Hono();

auth.post("/mini-app", async (c) => {
  const { initData } = await c.req.json();

  const parsed = parse(initData);

  if (!initData || !parsed.user) {
    return c.json(
      {},
      {
        status: 422,
      },
    );
  }

  try {
    if (!initData || !process.env.BOT_TOKEN) {
      throw new Error("Missing bot token or initData");
    }

    validate(initData, process.env.BOT_TOKEN);

    const user = await findOrCreateUser(parsed.user);

    const token = await new jose.EncryptJWT({
      userId: user.id,
    })
      .setProtectedHeader({ alg: "dir", enc: "A128CBC-HS256" })
      .encrypt(jwtSecret);

    return c.json({
      token,
    });
  } catch (e) {
    console.warn(e);
    return c.text("401: Unauthorized", {
      status: 401,
    });
  }
});
