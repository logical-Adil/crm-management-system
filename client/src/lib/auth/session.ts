import type { AuthSession } from "./types";

/** Single cookie holding JSON session (tokens come from API body; we mirror them here). */
export const SESSION_COOKIE_NAME = "crm_auth_session";

const DEFAULT_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days if expiry not passed

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function getCookieRaw(name: string): string | null {
  if (!isBrowser()) return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? match[1] : null;
}

function setCookieRaw(name: string, value: string, maxAgeSeconds: number): void {
  if (!isBrowser()) return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function deleteCookieRaw(name: string): void {
  if (!isBrowser()) return;
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0`;
}

export type SaveSessionOptions = {
  /** Prefer API `tokens.refresh.expiry` (seconds) so the cookie matches refresh lifetime */
  maxAgeSeconds?: number;
};

export function loadSession(): AuthSession | null {
  if (!isBrowser()) return null;
  try {
    const raw = getCookieRaw(SESSION_COOKIE_NAME);
    if (!raw) return null;
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const s = parsed as Partial<AuthSession>;
    if (
      typeof s.accessToken !== "string" ||
      typeof s.refreshToken !== "string" ||
      !s.user ||
      typeof s.user !== "object"
    ) {
      return null;
    }
    return s as AuthSession;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession, options?: SaveSessionOptions): void {
  if (!isBrowser()) return;
  const maxAge = options?.maxAgeSeconds ?? DEFAULT_MAX_AGE_SEC;
  const payload = JSON.stringify(session);
  setCookieRaw(SESSION_COOKIE_NAME, payload, maxAge);
}

export function clearSession(): void {
  if (!isBrowser()) return;
  deleteCookieRaw(SESSION_COOKIE_NAME);
}
