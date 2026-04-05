/**
 * Mirrors Nest `AuthService.login` + `TokenService.issueTokens` shapes.
 */
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  organizationId: string;
  createdById: string | null;
};

export type TokenBundle = {
  access: { token: string; expiry: number };
  refresh: { token: string; expiry: number };
};

export type LoginResponse = {
  user: AuthUser;
  tokens: TokenBundle;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  /** Used only for `POST /auth/logout` — not paired with a refresh API call in this client */
  refreshToken: string;
};
