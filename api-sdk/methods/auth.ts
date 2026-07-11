import type { API } from "..";

export async function authMiniAPP(this: API, initData: string) {
  const data = await this.post<{ token: string }>("/auth/mini-app", {
    initData,
  }).then((r) => r.data);

  this.storeToken(data.token);
  return data;
}

export async function oauth(this: API, user: {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}) {
  const data = await this.post<{ token: string }>("/auth/oauth", {
    user,
  }).then((r) => r.data);

  this.storeToken(data.token);
  return data;
}
