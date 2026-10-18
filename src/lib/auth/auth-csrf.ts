import 'server-only';

import { randomBytes, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export const CSRF_COOKIE = 'auth_csrf';
const CSRF_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
}

/** The configured public URL is authoritative; forwarded request headers are not. */
export function trustedAuthOrigin(request: NextRequest): string | null {
  try {
    return new URL(process.env.AUTH_APP_URL || request.nextUrl.origin).origin;
  } catch {
    return null;
  }
}

function originIsTrusted(request: NextRequest, required: boolean): boolean {
  const origin = request.headers.get('origin');
  const trusted = trustedAuthOrigin(request);
  return trusted !== null && request.headers.get('sec-fetch-site') !== 'cross-site'
    && ((!required && origin === null) || origin === trusted);
}

export function authJson(data: unknown, status = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}

/** Require both an exact same-origin request and an HttpOnly double-submit token. */
export function validateAuthMutation(request: NextRequest): NextResponse | null {
  const cookie = request.cookies.get(CSRF_COOKIE)?.value ?? '';
  const header = request.headers.get('x-csrf-token') ?? '';
  if (!originIsTrusted(request, true) || !CSRF_PATTERN.test(cookie)
    || !CSRF_PATTERN.test(header)
    || !timingSafeEqual(Buffer.from(cookie), Buffer.from(header))) {
    return authJson({ code: 'CSRF_INVALID', message: 'Please reload this page and try again.' }, 403);
  }
  return null;
}

export function issueAuthCsrf(request: NextRequest): NextResponse {
  if (!originIsTrusted(request, false)) {
    return authJson({ code: 'CSRF_INVALID', message: 'Request origin is not allowed.' }, 403);
  }
  const existing = request.cookies.get(CSRF_COOKIE)?.value ?? '';
  const token = CSRF_PATTERN.test(existing) ? existing : randomBytes(32).toString('base64url');
  const response = authJson({ csrfToken: token });
  response.cookies.set(CSRF_COOKIE, token, { ...authCookieOptions(), maxAge: 86400 });
  return response;
}
