export const BACKEND_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Shared HS256 secret used to VERIFY (not just decode) the backend-issued
 * access token in middleware / server components. Must equal the back-end's
 * `JWT_ACCESS_SECRET`. Server-only — never prefix with NEXT_PUBLIC.
 *
 * Provision in the front-end's Vercel env for Preview + Production. When unset,
 * token verification fails closed (role-gated routes deny access).
 */
export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? '';
