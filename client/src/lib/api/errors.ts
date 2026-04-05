export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }

  static fromResponse(status: number, body: unknown): ApiError {
    const message = parseNestMessage(body) ?? `Request failed (${status})`;
    return new ApiError(message, status, body);
  }
}

function parseNestMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const rec = body as Record<string, unknown>;
  const raw = rec.message;
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw) && raw.every((x): x is string => typeof x === "string")) {
    return raw.join(". ");
  }
  if (typeof rec.error === "string") return rec.error;
  return null;
}
