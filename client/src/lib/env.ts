/**
 * Public env vars only (`NEXT_PUBLIC_*`). Single place to read client config.
 * Defaults match server/.env.example (PORT=5000, URI version v1).
 */
const trimTrailingSlash = (url: string) => url.replace(/\/+$/, "");

export const env = {
  appUrl: trimTrailingSlash(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  apiBaseUrl: trimTrailingSlash(
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1",
  ),
} as const;
