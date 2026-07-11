import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import * as auth from "./methods/auth";
import * as chats from "./methods/chats";
import * as privacy from "./methods/privacy";

const TOKEN_STORAGE_KEY = "convo_assist_token";

export class API {
  _axios: AxiosInstance;

  get: AxiosInstance["get"];
  post: AxiosInstance["post"];
  put: AxiosInstance["put"];
  patch: AxiosInstance["patch"];
  delete: AxiosInstance["delete"];

  _token: string | null = null;

  storeToken(token: string) {
    this._token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  }

  restoreToken() {
    if (typeof window !== "undefined") {
      this._token = localStorage.getItem(TOKEN_STORAGE_KEY);
    }
  }

  hasToken() {
    return Boolean(this._token);
  }

  constructor(baseURL: string = "/api") {
    this.restoreToken();

    this._axios = axios.create({
      baseURL,
      adapter: "fetch",
    });

    this._axios.interceptors.request.use((config: InternalAxiosRequestConfig<any>) => {
      if (this._token) {
        config.headers.Authorization = `Bearer ${this._token}`;
      }
      return config;
    });

    this.get = this._axios.get.bind(this._axios);
    this.post = this._axios.post.bind(this._axios);
    this.put = this._axios.put.bind(this._axios);
    this.patch = this._axios.patch.bind(this._axios);
    this.delete = this._axios.delete.bind(this._axios);
  }

  // Auth
  authMiniAPP = auth.authMiniAPP.bind(this);
  oauth = auth.oauth.bind(this);

  // Chats
  listChats = chats.listChats.bind(this);
  getChat = chats.getChat.bind(this);
  updateChatSettings = chats.updateChatSettings.bind(this);
  getMyChatUserData = chats.getMyChatUserData.bind(this);
  updateMyChatOptOut = chats.updateMyChatOptOut.bind(this);
  deleteChatMessages = chats.deleteChatMessages.bind(this);

  // Privacy
  getMyPrivacy = privacy.getMyPrivacy.bind(this);
  updateMyPrivacy = privacy.updateMyPrivacy.bind(this);
  deleteMyMessages = privacy.deleteMyMessages.bind(this);
}

export const api = new API();
