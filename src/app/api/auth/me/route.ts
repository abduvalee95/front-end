/**
 * Me API Route
 * Returns current authenticated user info
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { TOKEN_CONFIG } from '@/lib/auth/token-config';
import { serverLogger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get(TOKEN_CONFIG.access.cookieName)?.value;

    if (!accessToken) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${backendUrl}/user/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always get fresh data
    });

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { message: 'Session expired' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { message: 'Failed to fetch user' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ user: data.user || data });
  } catch (error) {
    serverLogger.error('Me endpoint error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}
