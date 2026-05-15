/**
 * Logout API Route
 * Clears cookies and optionally invalidates session on backend
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { TOKEN_CONFIG, CLEAR_COOKIE_OPTIONS } from '@/lib/auth/token-config';
import { serverLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const accessToken = request.cookies.get(TOKEN_CONFIG.access.cookieName)?.value;

    // Optional: Tell backend to invalidate the session
    if (accessToken) {
      try {
        await fetch(`${backendUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
      } catch {
        // Ignore backend logout errors, we must clear cookies regardless
      }
    }

    // Create success response
    const res = NextResponse.json({ success: true });

    // Clear access token cookie
    res.cookies.set({
      name: TOKEN_CONFIG.access.cookieName,
      value: '',
      ...CLEAR_COOKIE_OPTIONS,
    });

    // Clear refresh token cookie
    res.cookies.set({
      name: TOKEN_CONFIG.refresh.cookieName,
      value: '',
      ...CLEAR_COOKIE_OPTIONS,
    });

    return res;
  } catch (error) {
    serverLogger.error('Logout error:', error);
    
    // Even on error, try to clear cookies
    const res = NextResponse.json(
      { message: 'Error during logout' },
      { status: 500 }
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
}
