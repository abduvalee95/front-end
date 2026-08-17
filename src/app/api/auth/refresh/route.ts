/**
 * Refresh Token API Route
 * Refreshes access token using refresh token cookie
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  TOKEN_CONFIG,
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  CLEAR_COOKIE_OPTIONS,
} from '@/lib/auth/token-config';
import { serverLogger } from '@/lib/logger';
import { BACKEND_URL } from '@/lib/server-env';
import { readJsonBody, isUsableToken } from '@/lib/auth/backend-response';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get(TOKEN_CONFIG.refresh.cookieName)?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { message: 'No refresh token' },
        { status: 401 }
      );
    }

    // An unreachable backend is 502, not 500. Reporting it as our own failure
    // sends the next person reading the logs to the wrong service.
    let response: Response;
    try {
      response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch (error) {
      serverLogger.error(`Refresh: backend unreachable at ${BACKEND_URL}`, error);
      return NextResponse.json(
        { message: 'Authentication service is unavailable' },
        { status: 502 }
      );
    }

    if (!response.ok) {
      // Refresh failed - clear cookies and return 401
      const res = NextResponse.json(
        { message: 'Session expired' },
        { status: 401 }
      );
      
      res.cookies.set({
        name: TOKEN_CONFIG.access.cookieName,
        value: '',
        ...CLEAR_COOKIE_OPTIONS,
      });
      res.cookies.set({
        name: TOKEN_CONFIG.refresh.cookieName,
        value: '',
        ...CLEAR_COOKIE_OPTIONS,
      });
      
      return res;
    }

    const data = (await readJsonBody(response)) as {
      accessToken?: unknown;
      refreshToken?: unknown;
    } | null;

    const newAccessToken = data?.accessToken;
    // Backend may or may not return a new refresh token
    const newRefreshToken = isUsableToken(data?.refreshToken)
      ? data.refreshToken
      : refreshToken;

    // Without a usable access token there is nothing to refresh. Writing the
    // cookie anyway stores the string "undefined" — a session that looks valid
    // to every `cookies.has()` check and fails every signature check.
    if (!isUsableToken(newAccessToken)) {
      serverLogger.error('Refresh: backend returned 200 without an access token');
      return NextResponse.json(
        { message: 'Authentication service returned an unexpected response' },
        { status: 502 }
      );
    }

    const res = NextResponse.json({ success: true });

    // Set new access token cookie
    res.cookies.set({
      name: TOKEN_CONFIG.access.cookieName,
      value: newAccessToken,
      ...ACCESS_COOKIE_OPTIONS,
    });

    // Set new refresh token cookie (if backend rotated it)
    res.cookies.set({
      name: TOKEN_CONFIG.refresh.cookieName,
      value: newRefreshToken,
      ...REFRESH_COOKIE_OPTIONS,
    });

    return res;
  } catch (error) {
    serverLogger.error('Refresh error:', error);
    return NextResponse.json(
      { message: 'Internal server error during refresh' },
      { status: 500 }
    );
  }
}
