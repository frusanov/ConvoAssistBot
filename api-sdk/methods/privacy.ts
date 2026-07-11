import type { WithMeta } from "@/types/api";
import type { API } from "..";

export async function getMyPrivacy(this: API) {
  return await this.get<WithMeta<{ globallyOptedOut: boolean }>>(
    "/privacy/me",
  ).then((r) => r.data);
}

export async function updateMyPrivacy(
  this: API,
  settings: { globallyOptedOut?: boolean },
) {
  return await this.patch<WithMeta<{ globallyOptedOut: boolean }>>(
    "/privacy/me",
    settings,
  ).then((r) => r.data);
}

export async function deleteMyMessages(this: API) {
  return await this.delete<{ success: boolean }>("/privacy/me/messages").then(
    (r) => r.data,
  );
}
