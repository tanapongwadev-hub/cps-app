"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { queryClient } from "@/lib/query-client";
import { apiClient } from "@/services/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { setupMockHandler } from "@/mocks";
import { Toaster } from "@/components/ui/toaster";
import { isMockMode } from "@/config/env";
import { authApi } from "@/features/auth/api/auth-api";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Wire API client to auth store
  React.useEffect(() => {
    apiClient.setAccessTokenProvider(() => useAuthStore.getState().accessToken);
    apiClient.setOnUnauthorized(() => {
      // 401 after refresh failed → mark session as expired (so /session-expired
      // can be shown) but keep the user so the page can render personalised copy.
      if (!isMockMode) {
        useAuthStore.getState().expireSession();
      }
    });
    apiClient.setRefreshHandler(async () => {
      const { refreshToken } = useAuthStore.getState();
      if (!refreshToken) return false;
      try {
        const res = await authApi.refresh(refreshToken);
        const auth = res?.authentication;
        if (!auth?.accessToken) return false;
        const expiresInMs = parseExpiresInMs(auth.expiresIn);
        useAuthStore
          .getState()
          .setTokens(auth.accessToken, auth.refreshToken, Date.now() + expiresInMs);
        return true;
      } catch {
        return false;
      }
    });
    if (isMockMode) {
      setupMockHandler(apiClient);
    }
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

const parseExpiresInMs = (raw: number | string | undefined, fallbackSeconds = 3600): number => {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw * 1000;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    const m = /^(\d+)\s*(ms|s|m|h|d)$/i.exec(trimmed);
    if (m) {
      const n = Number(m[1]);
      const unit = (m[2] ?? "s").toLowerCase();
      const mult =
        unit === "ms" ? 1 : unit === "s" ? 1000 : unit === "m" ? 60_000 : unit === "h" ? 3_600_000 : 86_400_000;
      return n * mult;
    }
    const asNum = Number(trimmed);
    if (Number.isFinite(asNum)) return asNum * 1000;
  }
  return fallbackSeconds * 1000;
};
