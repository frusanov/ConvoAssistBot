import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(__dirname);

export default defineConfig({
  out: "./db/drizzle",
  schema: "./db/schema/**/*.sql.ts",
  dialect: "postgresql",
  driver: "pglite",
  dbCredentials: {
    url: process.env.DATABASE_URL! || "./tmp/db",
  },
});
