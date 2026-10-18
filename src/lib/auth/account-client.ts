'use client';

import { withSessionLock } from './session-lock';

const credentialWrites = new Set([
  '/api/auth/refresh',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/accounts/login',
  '/api/auth/accounts/logout',
  '/api/auth/accounts/select-organization',
  '/api/auth/accounts/reset-password',
]);

/** Only same-origin BFF routes are reachable through this browser helper. */
export class AuthApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, public readonly retryAfter?: string) {
    super(code);
    this.name = 'AuthApiError';
  }
}

let csrfPromise: Promise<string> | null = null;

export function resetAuthCsrf() {
  csrfPromise = null;
}

async function csrfToken(): Promise<string> {
  if (!csrfPromise) {
    csrfPromise = fetch('/api/auth/csrf', {
      credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(30_000),
    }).then(async response => {
      if (!response.ok) throw new AuthApiError(response.status, 'CSRF_UNAVAILABLE');
      const data: unknown = await response.json();
      if (!data || typeof data !== 'object' || !('csrfToken' in data) || typeof data.csrfToken !== 'string') {
        throw new AuthApiError(502, 'CSRF_UNAVAILABLE');
      }
      return data.csrfToken;
    }).catch(error => {
      csrfPromise = null;
      throw error;
    });
  }
  return csrfPromise;
}

export async function authRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!/^\/api\/auth\/[a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)*$/.test(path)) {
    throw new AuthApiError(400, 'INVALID_AUTH_PATH');
  }
  const method = (options.method ?? 'GET').toUpperCase();
  const mutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  async function send(retryCsrf: boolean): Promise<T> {
    const headers = new Headers(options.headers);
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (mutation) headers.set('X-CSRF-Token', await csrfToken());
    const response = await fetch(path, {
      ...options, method, headers, credentials: 'same-origin', cache: 'no-store',
      signal: options.signal ?? AbortSignal.timeout(30_000),
    });
    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const code = data && typeof data === 'object' && 'code' in data && typeof data.code === 'string'
        ? data.code : 'AUTH_REQUEST_FAILED';
      // A CSRF rejection occurs before any backend mutation, so this one retry is safe.
      if (mutation && retryCsrf && response.status === 403 && code === 'CSRF_INVALID') {
        resetAuthCsrf();
        return send(false);
      }
      throw new AuthApiError(response.status, code, response.headers.get('Retry-After') ?? undefined);
    }
    return data as T;
  }
  // Read the shared HttpOnly cookie only when fetch starts inside the lock.
  // A waiting tab then rotates the latest token rather than replaying an old one.
  // CSRF retries stay in this same lock and never acquire it recursively.
  return method === 'POST' && credentialWrites.has(path) ? withSessionLock(() => send(true)) : send(true);
}
