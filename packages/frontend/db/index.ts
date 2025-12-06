import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";

const client = new PGlite(process.env.DATABASE_URL || "./tmp/db");
export const db = drizzle({ client });
