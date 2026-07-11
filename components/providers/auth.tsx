"use client";

import type { WebAppInitData, WebAppUser } from "telegram-web-app";

import {
  createContext,
  type FC,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "@/api-sdk";
import Script from "next/script";

declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void;
  }
}

export interface AuthContextPayload {
  initData: string;
  initDataUnsafe: WebAppInitData;
  user: WebAppUser;
}

export const AuthContext = createContext<AuthContextPayload | null>(null);

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [context, setContext] = useState<AuthContextPayload | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Try Mini App auth on mount
  useEffect(() => {
    const script = document.querySelector(
      'script[src^="https://telegram.org/js/telegram-web-app.js"]',
    ) as HTMLScriptElement;

    const handleLoad = () => {
      const initData = window.Telegram?.WebApp?.initData;
      if (initData) {
        setContext({
          user: window.Telegram.WebApp.initDataUnsafe.user as WebAppUser,
          initData,
          initDataUnsafe: window.Telegram.WebApp.initDataUnsafe,
        });
      } else {
        // Not in Mini App — show OAuth fallback
        setIsLoading(false);
      }
    };

    if (script) {
      script.addEventListener("load", handleLoad);
      // If script already loaded
      if (script.getAttribute("src")?.includes("telegram-web-app.js")) {
        handleLoad();
      }
    } else {
      handleLoad();
    }

    return () => script?.removeEventListener("load", handleLoad);
  }, []);

  // When Mini App context is ready, authenticate
  useEffect(() => {
    if (!context?.initData) return;

    api
      .authMiniAPP(context.initData)
      .then(({ token }) => {
        setToken(token);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [context?.initData]);

  // OAuth fallback handler (Telegram Login Widget)
  useEffect(() => {
    window.onTelegramAuth = (user) => {
      api
        .oauth(user)
        .then(({ token }) => {
          setToken(token);
          setContext({
            user,
            initData: "",
            initDataUnsafe: {} as WebAppInitData,
          });
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!token) {
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
        <div className="flex items-center justify-center min-h-screen">
          Sign in with Telegram
        </div>
      </>
    );
  }

  return (
    <AuthContext.Provider value={context}>{children}</AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext) as AuthContextPayload;
}
