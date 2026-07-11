import { useCallback } from "react";
import { useAuth } from "@/components/providers/auth";

export function useFetch() {
  const { initData } = useAuth();

  const fetchCallback = useCallback(
    (input: RequestInfo | URL, init?: RequestInit) => {
      return fetch(input, {
        ...(init || {}),
        headers: {
          "x-initial-data": initData,
          ...(init?.headers || {}),
        },
      });
    },
    [initData],
  );

  return {
    fetch: fetchCallback,
  };
}
