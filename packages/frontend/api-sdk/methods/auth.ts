import { API } from "..";

export async function authMiniAPP(this: API, initData: string) {
  const data = await this.post<{ token: string }>("/auth/mini-app", {
    initData,
  }).then((r) => r.data);

  this._auth = data.token;

  return data;
}
