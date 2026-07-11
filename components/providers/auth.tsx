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
import Script from "next/script";

export interface AuthContextPayload {
  initData: string;
  initDataUnsafe: WebAppInitData;
  user: WebAppUser;
}

export const AuthContext = createContext<AuthContextPayload | null>(null);

enum AuthStages {
  Init,
  CheckingExiting,
  TryingMiniApp,
  HasAuth,
}

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [authStage, setAuthStage] = useState(AuthStages.Init);

  const [context, setContext] = useState<AuthContextPayload | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [hasAuth, setHasAuth] = useState(false);

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

  useEffect(() => {
    window.onTelegramAuth = function onTelegramAuth(user) {
      console.log({ user });

      api.oauth(user).then(({ token }) => {
        console.log({ token });
        setContext({
          user,
        });
        setToken(token);
      });
    };
  }, []);

  if (authStage === AuthStages.Init) {
    return <>Trying to get auth</>;
  }

  if (!token)
    return (
      <>
        <Script
          async
          src="https://telegram.org/js/telegram-widget.js?22"
          data-telegram-login="ConvoAssistTestBot"
          data-size="medium"
          data-userpic="false"
          data-onauth="onTelegramAuth(user)"
          data-request-access="write"
        />

        <span>no auth</span>
      </>
    );

  return (
    <AuthContext.Provider value={context}>{children}</AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext) as AuthContextPayload;
}
