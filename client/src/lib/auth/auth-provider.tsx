"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { loginRequest, loginResponseToSession, logoutRequest } from "./auth-api";
import { clearSession, loadSession, saveSession } from "./session";
import type { LoginResponse } from "./types";
import type { AuthSession, AuthUser } from "./types";

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isReady: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setSession(loadSession());
    setIsReady(true);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res: LoginResponse = await loginRequest({ email, password });
      const next = loginResponseToSession(res);
      saveSession(next, { maxAgeSeconds: res.tokens.refresh.expiry });
      setSession(next);
      router.push("/");
      router.refresh();
    },
    [router],
  );

  const signOut = useCallback(async () => {
    const refreshToken = session?.refreshToken;
    clearSession();
    setSession(null);
    try {
      if (refreshToken) {
        await logoutRequest(refreshToken);
      }
    } catch {
      /* session already cleared; ignore network errors */
    }
    router.push("/login");
    router.refresh();
  }, [session?.refreshToken, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      isReady,
      isAuthenticated: !!session?.accessToken,
      signIn,
      signOut,
    }),
    [session, isReady, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
