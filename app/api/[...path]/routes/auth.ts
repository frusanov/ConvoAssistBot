import { Hono } from "hono";
import { validate, parse } from "@tma.js/init-data-node";
import { userQueries } from "@/db/queries";
import { encodeJWT } from "../middleware/jwt-auth-middleware";
import { User } from "telegraf/types";
import crypto from "crypto";

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

    const user = await userQueries.findOrCreateUser(parsed.user);

    const token = await encodeJWT({
      userId: user.id,
    });

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

// Helper function to verify Telegram OAuth data
function verifyTelegramAuth(data: any): boolean {
  if (!process.env.BOT_TOKEN) {
    throw new Error("Missing bot token");
  }

  const { hash, ...authData } = data;

  if (!hash) {
    return false;
  }

  // Create data-check-string by sorting keys alphabetically and concatenating
  const dataCheckString = Object.keys(authData)
    .sort()
    .map((key) => `${key}=${authData[key]}`)
    .join("\n");

  // Create secret key from bot token
  const secretKey = crypto
    .createHash("sha256")
    .update(process.env.BOT_TOKEN)
    .digest();

  // Create HMAC-SHA-256 signature
  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  return hmac === hash;
}

auth.post("/oauth", async (c) => {
  try {
    const { user: userData } = await c.req.json();

    // Validate required fields
    if (
      !userData.id ||
      !userData.first_name ||
      !userData.auth_date ||
      !userData.hash
    ) {
      return c.json(
        { error: "Missing required fields: id, first_name, auth_date, hash" },
        {
          status: 422,
        },
      );
    }

    // Verify the auth_date to prevent replay attacks (optional but recommended)
    const authDate = userData.auth_date;
    const currentTime = Math.floor(Date.now() / 1000);
    const maxAge = 60; // seconds

    if (currentTime - authDate > maxAge) {
      return c.text("401: Auth data too old", {
        status: 401,
      });
    }

    // Verify Telegram authentication
    if (!verifyTelegramAuth(userData)) {
      return c.text("401: Invalid authentication", {
        status: 401,
      });
    }

    // Create user object in the format expected by findOrCreateUser
    const user: User = {
      id: userData.id,
      is_bot: false,
      first_name: userData.first_name,
      username: userData.username,
      language_code: undefined,
    };

    const dbUser = await userQueries.findOrCreateUser(user);

    const token = await encodeJWT({
      userId: dbUser.id,
    });

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
