import { env } from "@/lib/env";

import { ApiError } from "./errors";

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  /** JSON body — serialized with JSON.stringify */
  json?: unknown;
  /** Omit to skip Authorization header */
  accessToken?: string | null;
};

/**
 * Typed fetch to the Nest API (`NEXT_PUBLIC_API_URL`). Throws {@link ApiError} on non-OK.
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { json, accessToken, headers: initHeaders, ...rest } = options;
  const base = env.apiBaseUrl;
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers(initHeaders);
  if (!headers.has("Content-Type") && json !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const res = await fetch(url, {
    ...rest,
    headers,
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    throw ApiError.fromResponse(res.status, data);
  }

  return data as T;
}
