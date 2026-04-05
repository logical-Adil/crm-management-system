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
