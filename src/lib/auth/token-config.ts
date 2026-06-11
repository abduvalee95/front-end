/**
 * Token Configuration
 * Enterprise SaaS Grade Security Settings
 */

import { TokenConfig, CookieOptions } from '@/types/auth';

// Token time-to-live configuration
export const TOKEN_CONFIG: TokenConfig = {
  access: {
    cookieName: 'access_token',
    ttlSeconds: 15 * 60, // 15 minutes
    ttlMs: 15 * 60 * 1000,
    refreshBeforeMs: 2 * 60 * 1000, // Refresh 2 minutes before expiry
  },
  refresh: {
    cookieName: 'refresh_token',
    ttlSeconds: 7 * 24 * 60 * 60, // 7 days
    ttlMs: 7 * 24 * 60 * 60 * 1000,
  },
};

// All auth cookies are consumed same-origin only: the browser talks to the
// front-end's own /api/* routes, and the backend is reached via the
// server-side proxy. SameSite=Lax therefore works everywhere and blocks CSRF —
// a foreign site cannot make the browser attach these cookies to a
// state-changing request.
const COOKIE_SAME_SITE = 'lax' as const;

// Cookie options for access token (shorter lived)
export const ACCESS_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: COOKIE_SAME_SITE,
  path: '/',
  maxAge: TOKEN_CONFIG.access.ttlSeconds,
};

// Cookie options for refresh token (longer lived)
export const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: COOKIE_SAME_SITE,
  path: '/',
  maxAge: TOKEN_CONFIG.refresh.ttlSeconds,
};

// Cookie options for clearing tokens
export const CLEAR_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: COOKIE_SAME_SITE,
  path: '/',
  maxAge: 0,
};

// Helper to check if token is about to expire
export function isTokenExpiringSoon(tokenIssuedAtMs?: number): boolean {
  if (!tokenIssuedAtMs) return true;
  
  const expiresAt = tokenIssuedAtMs + TOKEN_CONFIG.access.ttlMs;
  const refreshThreshold = TOKEN_CONFIG.access.refreshBeforeMs;
  
  return Date.now() >= expiresAt - refreshThreshold;
}

// Helper to calculate time until refresh needed
export function getTimeUntilRefresh(tokenIssuedAtMs?: number): number {
  if (!tokenIssuedAtMs) return 0;
  
  const expiresAt = tokenIssuedAtMs + TOKEN_CONFIG.access.ttlMs;
  const refreshAt = expiresAt - TOKEN_CONFIG.access.refreshBeforeMs;
  const delay = refreshAt - Date.now();
  
  return Math.max(0, delay);
}
