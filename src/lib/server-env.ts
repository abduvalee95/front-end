const RAW_BACKEND_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Normalise the configured backend origin.
 *
 * `fetch()` and `new URL()` both require an absolute URL, so a value pasted
 * without a scheme — `back-end-theta-two.vercel.app` — throws
 * `ERR_INVALID_URL` at request time rather than at boot. That failure mode is
 * invisible until someone tries to log in, and it reads as "the backend is
 * down" instead of "the environment variable is missing five characters".
 *
 * A bare host is assumed to be HTTPS; `localhost` and `127.0.0.1` fall back to
 * HTTP so local development keeps working. Trailing slashes are dropped so
 * callers can join paths without doubling up.
 */
function normalizeBackendUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return 'http://localhost:3001';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const isLocal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(trimmed);
  return `${isLocal ? 'http' : 'https'}://${trimmed}`;
}

export const BACKEND_URL = normalizeBackendUrl(RAW_BACKEND_URL);

/**
 * Shared HS256 secret used to VERIFY (not just decode) the backend-issued
 * access token in middleware / server components. Must equal the back-end's
 * `JWT_ACCESS_SECRET`. Server-only — never prefix with NEXT_PUBLIC.
 *
 * Provision in the front-end's Vercel env for Preview + Production. When unset,
 * token verification fails closed (role-gated routes deny access).
 */
export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? '';

/**
 * Configuration problems that only surface as a failed login. Logged once per
 * cold start so they show up in the deployment's runtime logs instead of
 * waiting for a user to report "login doesn't work".
 *
 * Never logs a secret — only whether one is present.
 */
export function reportServerEnv(log: {
  warn: (...args: unknown[]) => void;
}): void {
  if (process.env.NODE_ENV !== 'production') return;

  if (BACKEND_URL !== RAW_BACKEND_URL.trim()) {
    log.warn(
      `API_URL was normalised to "${BACKEND_URL}" — set it with an explicit https:// scheme.`,
    );
  }
  if (/localhost|127\.0\.0\.1/.test(BACKEND_URL)) {
    log.warn(
      'API_URL / NEXT_PUBLIC_API_URL is unset in this environment; the backend points at localhost and every request will fail.',
    );
  }
  if (!JWT_ACCESS_SECRET) {
    log.warn(
      'JWT_ACCESS_SECRET is unset in this environment; role-gated routes fail closed and will deny access after login.',
    );
  }
}
