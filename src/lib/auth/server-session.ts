import { cookies } from 'next/headers';
import { verifyAccessToken, type AccessClaims } from './verify-token';
import { TOKEN_CONFIG } from './token-config';

/**
 * The caller's verified session, for route handlers that must not run
 * anonymously.
 *
 * Server-only, and named apart from `./session` on purpose — that one is the
 * browser-side lifecycle service (restore/end, Zustand, toasts) and must not
 * be pulled into a route handler.
 *
 * Middleware alone is not enough here: it only checks that an `access_token`
 * cookie EXISTS, never that it verifies. Any route that spends money or writes
 * data has to confirm the signature itself, which is what this does — one
 * implementation so the AI routes cannot drift apart from each other.
 */

export interface ServerSession {
  /** The raw access token, for forwarding to the backend as a Bearer. */
  token: string;
  claims: AccessClaims;
}

export async function getServerSession(): Promise<ServerSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_CONFIG.access.cookieName)?.value;

  if (!token) return null;

  // Only a currently-valid signature counts. An expired token is authentic but
  // stale, and the caller should refresh rather than be let through.
  const verified = await verifyAccessToken(token);
  if (verified.status !== 'valid') return null;

  return { token, claims: verified.claims };
}

/**
 * Stable identity to count requests against.
 *
 * `sub` is the user id from the token, so a caller cannot reset their own quota
 * by clearing cookies — they would have to log in as someone else. When the
 * backend omits `sub`, the organisation is the next-best bucket; falling back
 * to a shared constant would let one user exhaust everyone's allowance, so the
 * organisation is deliberately the widest this ever gets.
 */
export function rateLimitKey(session: ServerSession): string {
  if (session.claims.sub) return `user:${session.claims.sub}`;
  if (session.claims.organization_id) return `org:${session.claims.organization_id}`;
  return 'unidentified';
}
