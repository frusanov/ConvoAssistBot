"use client";

import type { WebAppInitData, WebAppUser } from "telegram-web-app";

import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "@/api-sdk";

export interface AuthContextPayload {
  initData: string;
  initDataUnsafe: WebAppInitData;
  user: WebAppUser;
}

export const AuthContext = createContext<AuthContextPayload | null>(null);

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [context, setContext] = useState<AuthContextPayload | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const script = window.document.querySelector(
      'script[src^="https://telegram.org/js/telegram-web-app.js"]',
    ) as HTMLScriptElement;

    script?.addEventListener("load", () => {
      if (window.Telegram.WebApp.initData === "") return;

      setContext({
        user: window.Telegram.WebApp.initDataUnsafe.user as WebAppUser,
        initData: window.Telegram.WebApp.initData,
        initDataUnsafe: window.Telegram.WebApp.initDataUnsafe,
      });
    });
  }, []);

  useEffect(() => {
    if (!context) return;

    api.authMiniAPP(context.initData).then(({ token }) => {
      setToken(token);
    });
  }, [context]);

  if (!token) return <>no auth</>;

  return (
    <AuthContext.Provider value={context}>{children}</AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext) as AuthContextPayload;
}
