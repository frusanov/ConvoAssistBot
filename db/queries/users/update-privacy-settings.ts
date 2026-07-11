import { db } from "@/db";
import { usersTable, UserPrivacySettings } from "@/db/schema/users.sql";
import { eq } from "drizzle-orm";

export async function updatePrivacySettings(
  userId: string,
  settings: Partial<UserPrivacySettings>,
) {
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .then((r) => r[0]);

  if (!user) throw new Error("User not found");

  const merged = {
    ...(user.privacySettings as UserPrivacySettings),
    ...settings,
  };

  return await db
    .update(usersTable)
    .set({ privacySettings: merged })
    .where(eq(usersTable.id, userId))
    .returning()
    .then((r) => r[0]);
}
