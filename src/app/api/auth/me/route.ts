/**
 * Me API Route
 * Returns current authenticated user info
 */

import { authJson } from '@/lib/auth/auth-csrf';
import type { NextRequest } from 'next/server';
import { TOKEN_CONFIG } from '@/lib/auth/token-config';
import { serverLogger } from '@/lib/logger';
import { BACKEND_URL } from '@/lib/server-env';
import { getAccountSessionRemaining } from '@/lib/auth/account-bff';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get(TOKEN_CONFIG.access.cookieName)?.value;

    if (!accessToken) {
      return authJson(
        { message: 'Not authenticated' },
        401
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return authJson(
          { message: 'Session expired' },
          401
        );
      }
      
      return authJson(
        { message: 'Failed to fetch user' },
        response.status
      );
    }

    const data = await response.json();
    const remaining = getAccountSessionRemaining(request);
    return authJson({ user: data.user || data, canSelectOrganization: remaining !== null && remaining > 0 });
  } catch {
    serverLogger.error('Me endpoint: backend unavailable');
    return authJson(
      { message: 'Server error' },
      502
    );
  }
}
