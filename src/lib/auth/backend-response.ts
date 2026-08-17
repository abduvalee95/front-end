/**
 * Helpers for reading a reply from the backend auth service.
 *
 * The backend is a separate service behind a platform gateway, so a failure
 * upstream does not necessarily arrive as JSON: a cold start, a crashed
 * instance or a wrong path answers with an HTML error page, and a rejected
 * request can answer 401 with no body at all. Calling `response.json()`
 * directly on any of those throws a SyntaxError, and a route that wraps its
 * body in one big try/catch then reports that as its own 500 — telling the
 * user "internal server error" when our server was fine and the backend, or
 * the environment variable pointing at it, was the problem.
 */

/** Parse the body as JSON, or return null when it is empty or not JSON. */
export async function readJsonBody(response: Response): Promise<unknown | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Pull `message` out of a backend error body, falling back when absent. */
export function messageFrom(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'message' in data) {
    const { message } = data as { message?: unknown };
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}

/** A token is only usable if it is a non-empty string. */
export function isUsableToken(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}
