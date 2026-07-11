import { findOrCreateUser } from "./find-or-create-user";
import { updatePrivacySettings } from "./update-privacy-settings";
import { findByTgId } from "./find-by-tg-id";
import { findById } from "./find-by-id";

export const userQueries = {
  findOrCreateUser,
  updatePrivacySettings,
  findByTgId,
  findById,
};
