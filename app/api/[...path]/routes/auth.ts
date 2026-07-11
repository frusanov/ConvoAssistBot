import { Hono } from "hono";
import { validate } from "@tma.js/init-data-node";
import { userQueries } from "@/db/queries";
import { encodeJWT } from "../middleware/jwt-auth-middleware";
import type { User } from "telegraf/types";
import crypto from "crypto";

export const auth = new Hono();

auth.post("/mini-app", async (c) => {
  try {
    const { initData } = await c.req.json();

    if (!initData || !process.env.BOT_TOKEN) {
      return c.json({}, { status: 422 });
    }

    // Cryptographic validation — throws if initData is tampered
    validate(initData, process.env.BOT_TOKEN);

    // Parse the user field from initData manually (URLSearchParams).
    // We cannot use @tma.js/init-data-node's parse() because v2 requires a
    // "signature" field that does not exist in standard Telegram init data.
    const params = new URLSearchParams(initData);
    const userJson = params.get("user");
    if (!userJson) {
      return c.json({}, { status: 422 });
    }

    const parsedUser: User = JSON.parse(userJson);

    const user = await userQueries.findOrCreateUser(parsedUser);

    const token = await encodeJWT({
      userId: user.id,
    });

    return c.json({ token });
  } catch (e) {
    console.warn("Mini App auth failed:", e);
    return c.text("401: Unauthorized", { status: 401 });
  }
});

// Helper function to verify Telegram OAuth data
function verifyTelegramAuth(data: Record<string, string>): boolean {
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
