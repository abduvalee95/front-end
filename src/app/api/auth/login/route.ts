/**
 * Login API Route
 * Handles user login and sets HttpOnly cookies
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  TOKEN_CONFIG,
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
} from '@/lib/auth/token-config';
import { serverLogger } from '@/lib/logger';
import { BACKEND_URL } from '@/lib/server-env';
import { readJsonBody, messageFrom, isUsableToken } from '@/lib/auth/backend-response';

export async function POST(request: NextRequest) {
  try {
    // A malformed body is the caller's mistake, not ours — 400, not 500.
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: 'Malformed request body' }, { status: 400 });
    }

    const { phone, password, remember_me } = (body ?? {}) as {
      phone?: string;
      password?: string;
      remember_me?: boolean;
    };

    // Validate required fields
    if (!phone || !password) {
      return NextResponse.json(
        { message: 'Phone number and password are required' },
        { status: 400 }
      );
    }

    // Forward login request to backend (uses phone, not email).
    //
    // A transport failure here means the backend is unreachable — a bad
    // API_URL, DNS, a cold start that timed out. That is 502, not 500: the
    // distinction is the whole difference between "redeploy the front-end" and
    // "look at the backend / the environment variable".
    let response: Response;
    try {
      response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, remember_me }),
      });
    } catch (error) {
      serverLogger.error(`Login: backend unreachable at ${BACKEND_URL}`, error);
      return NextResponse.json(
        { message: 'Authentication service is unavailable' },
        { status: 502 }
      );
    }

    const data = await readJsonBody(response);

    if (!response.ok) {
      return NextResponse.json(
        { message: messageFrom(data, 'Invalid credentials') },
        { status: response.status }
      );
    }

    const { accessToken, refreshToken, user } = (data ?? {}) as {
      accessToken?: unknown;
      refreshToken?: unknown;
      user?: unknown;
    };

    // A 200 that carries no tokens is an upstream contract break. Writing the
    // cookies anyway stores the string "undefined", which reads as a session
    // everywhere that only checks the cookie exists — the user lands on a
    // dashboard where every request then fails signature verification.
    if (!isUsableToken(accessToken) || !isUsableToken(refreshToken)) {
      serverLogger.error('Login: backend returned 200 without both tokens');
      return NextResponse.json(
        { message: 'Authentication service returned an unexpected response' },
        { status: 502 }
      );
    }

    // Create response with user data
    const res = NextResponse.json({ user });

    // Set access token cookie (HttpOnly, Secure, SameSite)
    res.cookies.set({
      name: TOKEN_CONFIG.access.cookieName,
      value: accessToken,
      ...ACCESS_COOKIE_OPTIONS,
    });

    // Set refresh token cookie
    res.cookies.set({
      name: TOKEN_CONFIG.refresh.cookieName,
      value: refreshToken,
      ...REFRESH_COOKIE_OPTIONS,
      // Extend refresh token if remember_me
      maxAge: remember_me ? TOKEN_CONFIG.refresh.ttlSeconds * 2 : TOKEN_CONFIG.refresh.ttlSeconds,
    });

    return res;
  } catch (error) {
    serverLogger.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error during login' },
      { status: 500 }
    );
  }
}
