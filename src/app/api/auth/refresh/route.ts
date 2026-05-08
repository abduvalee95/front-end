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

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get(TOKEN_CONFIG.refresh.cookieName)?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { message: 'No refresh token' },
        { status: 401 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${backendUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

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

    const data = await response.json();
    const newAccessToken = data.accessToken;
    // Backend may or may not return a new refresh token
    const newRefreshToken = data.refreshToken || refreshToken;

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
