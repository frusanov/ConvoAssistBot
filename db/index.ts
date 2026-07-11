import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://convoassist:convoassist@localhost:5432/convoassist";

const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool });
