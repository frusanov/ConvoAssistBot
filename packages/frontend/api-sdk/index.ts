import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import * as auth from "./methods/auth";
import * as chats from "./methods/chats";

export class API {
  _axios: AxiosInstance;

  get: AxiosInstance["get"];
  post: AxiosInstance["post"];
  put: AxiosInstance["put"];
  patch: AxiosInstance["patch"];
  delete: AxiosInstance["delete"];

  _token: string | null = null;

  constructor(baseURL: string = "/api") {
    this._axios = axios.create({
      baseURL,
      adapter: "fetch",
    });

    this._axios.interceptors.request.use(
      function (this: API, config: InternalAxiosRequestConfig<any>) {
        return {
          ...config,
          headers: {
            ...config.headers,
            Authorization: this._token ? `Bearer ${this._token}` : undefined,
          },
        } as InternalAxiosRequestConfig<any>;
      }.bind(this),
    );

    this.get = this._axios.get.bind(this._axios);
    this.post = this._axios.post.bind(this._axios);
    this.put = this._axios.put.bind(this._axios);
    this.patch = this._axios.patch.bind(this._axios);
    this.delete = this._axios.delete.bind(this._axios);
  }

  authMiniAPP = auth.authMiniAPP.bind(this);

  listChats = chats.listChats.bind(this);
  getChat = chats.getChat.bind(this);
}

export const api = new API();
