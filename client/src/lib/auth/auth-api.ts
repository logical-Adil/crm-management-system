import { apiRequest } from "@/lib/api";

import type { AuthSession, LoginResponse } from "./types";

export type LoginBody = {
  email: string;
  password: string;
};

export async function loginRequest(body: LoginBody): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    json: body,
  });
}

export async function logoutRequest(refreshToken: string): Promise<void> {
  await apiRequest<unknown>("/auth/logout", {
    method: "POST",
    json: { refreshToken },
  });
}

export function loginResponseToSession(res: LoginResponse): AuthSession {
  return {
    user: res.user,
    accessToken: res.tokens.access.token,
    refreshToken: res.tokens.refresh.token,
  };
}

export type SignInResult = {
  session: AuthSession;
  maxAgeSeconds: number;
};

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const res = await loginRequest({ email, password });
  return {
    session: loginResponseToSession(res),
    maxAgeSeconds: res.tokens.refresh.expiry,
  };
}

export async function signOut(refreshToken: string | null | undefined): Promise<void> {
  if (!refreshToken) return;
  try {
    await logoutRequest(refreshToken);
  } catch {
    /* session may already be cleared client-side */
  }
}
