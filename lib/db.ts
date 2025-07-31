import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { join } from "node:path";
import * as messages from "../entities/message";
import * as chat from "../entities/chat";

// In-memory Postgres
const client = new PGlite(join(process.cwd(), "tmp/db"));
export const db = drizzle({ client, schema: { messages, chat } });
