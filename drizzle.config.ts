import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./entities",
  out: "./drizzle",

  driver: "pglite",
  dbCredentials: {
    url: "./tmp/db",
  },
});
