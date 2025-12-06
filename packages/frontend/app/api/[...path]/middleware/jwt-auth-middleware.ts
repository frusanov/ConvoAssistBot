import { MiddlewareHandler } from "hono";
import * as jose from "jose";

declare global {
  namespace Hono {
    interface Context {
      userId?: string;
    }
  }
}

export const jwtSecret = jose.base64url.decode(
  "zH4NRP1HMALxxCFnRZABFA7GOJtzU_gIj02alfL1lvI",
);

export interface JWTPayload {
  userId: string;
}

export async function encodeJWT(payload: JWTPayload) {
  return await new jose.EncryptJWT({
    ...payload,
  })
    .setProtectedHeader({ alg: "dir", enc: "A128CBC-HS256" })
    .encrypt(jwtSecret);
}

export async function decodeJWT(jwt: string) {
  return await jose.jwtVerify(jwt, jwtSecret);
}

export const jwtAuthMiddleware: MiddlewareHandler = async (c, next) => {
  try {
    const authorizationHeader = c.req.header("Authorization");

    if (!authorizationHeader) throw new Error("Missing Authorization header");

    const jwt = authorizationHeader?.split(" ")[1];

    if (!jwt) throw new Error("Missing JWT");

    const { payload } = await decodeJWT(jwt);

    if (!payload.userId) throw new Error("Missing userId in JWT");

    c.set("userId", payload.userId);

    await next();
  } catch {
    return c.json(
      {},
      {
        status: 401,
      },
    );
  }
};
