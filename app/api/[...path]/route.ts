import { Hono } from "hono";
import { handle } from "hono/vercel";
import { authMiddleware } from "./middleware/auth-middleware";
import { chats } from "./routes/chats";
import { auth } from "./routes/auth";

const app = new Hono().basePath("/api");

// app.use(authMiddleware);

app.route("/auth", auth);
app.route("/chats", chats);

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
