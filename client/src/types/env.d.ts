/**
 * Augments Node’s `ProcessEnv` for public Next.js env vars consumed in `src/lib/env.ts`.
 * Ensures autocomplete and documentation for `process.env.NEXT_PUBLIC_*` in TypeScript.
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /** Public site URL (e.g. `http://localhost:3000`). */
    NEXT_PUBLIC_APP_URL?: string;
    /** Next.js base path when served under a subpath (e.g. `/client`). */
    NEXT_PUBLIC_BASE_PATH?: string;
    /** Nest API base, including `/api/v1` (e.g. `http://localhost:5000/api/v1`). */
    NEXT_PUBLIC_API_URL?: string;
  }
}
