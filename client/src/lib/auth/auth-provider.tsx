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

import { fetchCurrentUserRequest, meResponseToAuthUser } from "@/lib/users/users-api";

import { signIn as signInApi, signOut as signOutApi } from "./auth-api";
import { clearSession, loadSession, saveSession } from "./session";
import type { AuthSession, AuthUser } from "./types";

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isReady: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Refetch `/users/me` and update session (e.g. after creating or deleting a user). */
  refreshSessionUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Avoid infinite "Loading..." if the API never responds (wrong URL, CORS, hung server). */
const BOOTSTRAP_TIMEOUT_MS = 12000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      v => {
        clearTimeout(id);
        resolve(v);
      },
      e => {
        clearTimeout(id);
        reject(e);
      },
    );
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = loadSession();
      if (!stored?.accessToken) {
        setSession(null);
        setIsReady(true);
        return;
      }

      try {
        const me = await withTimeout(
          fetchCurrentUserRequest(stored.accessToken),
          BOOTSTRAP_TIMEOUT_MS,
        );
        if (cancelled) return;
        const user = meResponseToAuthUser(me);
        const next: AuthSession = { ...stored, user };
        saveSession(next);
        setSession(next);
      } catch {
        if (cancelled) return;
        clearSession();
        setSession(null);
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          router.replace("/login");
        }
      } finally {
        // Always unblock the UI (login shell, pages). Omitting this when `cancelled` breaks
        // React Strict Mode dev: cleanup sets cancelled before the first fetch settles.
        setIsReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { session: next, maxAgeSeconds } = await signInApi(email, password);
      saveSession(next, { maxAgeSeconds });
      setSession(next);
      router.push("/");
      router.refresh();
    },
    [router],
  );

  const logout = useCallback(async () => {
    const refreshToken = session?.refreshToken;
    clearSession();
    setSession(null);
    await signOutApi(refreshToken);
    router.push("/login");
    router.refresh();
  }, [session?.refreshToken, router]);

  const refreshSessionUser = useCallback(async () => {
    const stored = loadSession();
    if (!stored?.accessToken) return;
    try {
      const me = await fetchCurrentUserRequest(stored.accessToken);
      const user = meResponseToAuthUser(me);
      const next: AuthSession = { ...stored, user };
      saveSession(next);
      setSession(next);
    } catch {
      /* ignore — caller can retry */
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      isReady,
      isAuthenticated: !!session?.accessToken,
      login,
      logout,
      refreshSessionUser,
    }),
    [session, isReady, login, logout, refreshSessionUser],
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
