import { boolean, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { essentialsWithTgId } from "./_common";

export interface UserPrivacySettings {
  globallyOptedOut: boolean;
}

export const usersTable = pgTable("users", {
  ...essentialsWithTgId(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  username: text(),
  privacySettings: jsonb()
    .default({ globallyOptedOut: false } satisfies UserPrivacySettings)
    .notNull()
    .$type<UserPrivacySettings>(),
});
