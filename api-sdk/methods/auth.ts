import { User } from "telegraf/types";
import { API } from "..";

export async function authMiniAPP(this: API, initData: string) {
  const data = await this.post<{ token: string }>("/auth/mini-app", {
    initData,
  }).then((r) => r.data);

  this._token = data.token;

  return data;
}

export async function oauth(this: API, user: User) {
  const data = await this.post<{ token: string }>("/auth/oauth", {
    user,
  }).then((r) => r.data);

  this._token = data.token;

  return data;
}
