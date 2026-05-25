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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password, remember_me } = body;

    // Validate required fields
    if (!phone || !password) {
      return NextResponse.json(
        { message: 'Phone number and password are required' },
        { status: 400 }
      );
    }

    // Forward login request to backend (uses phone, not email)
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password, remember_me }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Invalid credentials' },
        { status: response.status }
      );
    }

    const { accessToken, refreshToken, user } = data;

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
