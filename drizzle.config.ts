import { defineConfig } from "drizzle-kit";

const dbPath = process.env.NODE_ENV == "production" ? "db" : "tmp/db";

export default defineConfig({
  dialect: "postgresql",
  schema: "./entities",
  out: "./drizzle",

  driver: "pglite",
  dbCredentials: {
    url: `./${dbPath}`,
  },
});
