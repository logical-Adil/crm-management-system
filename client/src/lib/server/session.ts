import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import type { AuthSession } from "@/lib/auth/types";

function parseSessionCookie(raw: string | undefined): AuthSession | null {
  if (!raw) return null;
  try {
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

/** Session from `crm_auth_session` cookie (same shape as client `loadSession`). */
export async function getServerSession(): Promise<AuthSession | null> {
  const jar = await cookies();
  return parseSessionCookie(jar.get(SESSION_COOKIE_NAME)?.value);
}
