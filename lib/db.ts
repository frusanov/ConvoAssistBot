import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { join } from "node:path";
import * as messages from "../entities/message";
import * as chat from "../entities/chat";

const dbPath = process.env.NODE_ENV == "production" ? "db" : "tmp/db";

const client = new PGlite(join(process.cwd(), dbPath));
export const db = drizzle({ client, schema: { messages, chat } });
