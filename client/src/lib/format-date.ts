/**
 * Formats an ISO datetime for display. Uses a fixed locale + options so
 * server-rendered HTML matches the browser during hydration (avoid `undefined` locale).
 */
export function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
