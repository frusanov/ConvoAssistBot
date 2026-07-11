import { Hono } from "hono";
import { handle } from "hono/vercel";
import { chats } from "./routes/chats";
import { auth } from "./routes/auth";
import { privacy } from "./routes/privacy";

const app = new Hono().basePath("/api");

app.route("/auth", auth);
app.route("/chats", chats);
app.route("/privacy", privacy);

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
