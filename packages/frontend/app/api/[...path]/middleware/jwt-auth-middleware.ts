import { MiddlewareHandler } from "hono";
import { decode, sign, verify } from "hono/jwt";
import * as jose from "jose";

declare module "hono" {
  interface Context {
    userId?: string;
  }
}

export const jwtSecret = "zH4NRP1HMALxxCFnRZABFA7GOJtzU_gIj02alfL1lvI";

export interface JWTPayload {
  userId: string;
}

export async function encodeJWT(payload: JWTPayload) {
  return await sign({ ...payload }, jwtSecret);
}

export async function decodeJWT(jwt: string) {
  return await verify(jwt, jwtSecret);
}

export const jwtAuthMiddleware: MiddlewareHandler = async (c, next) => {
  try {
    const authorizationHeader = c.req.header("Authorization");

    if (!authorizationHeader) throw new Error("Missing Authorization header");

    const jwt = authorizationHeader?.split(" ")[1];

    if (!jwt) throw new Error("Missing JWT");

    const payload = await decodeJWT(jwt);

    if (!payload.userId) throw new Error("Missing userId in JWT");

    c.userId = payload.userId as string;

    await next();
  } catch (e) {
    console.warn(e);
    return c.json(
      {},
      {
        status: 401,
      },
    );
  }
};
