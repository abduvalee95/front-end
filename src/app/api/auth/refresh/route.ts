import { NextRequest } from 'next/server';
import { BACKEND_URL } from '@/lib/server-env';
import { TOKEN_CONFIG } from '@/lib/auth/token-config';
import { readJsonBody, isUsableToken } from '@/lib/auth/backend-response';
import { authJson, validateAuthMutation } from '@/lib/auth/auth-csrf';
import { ACCOUNT_COOKIE, getAccountSessionRemaining, clearTenantCookies, setTenantAuthCookies } from '@/lib/auth/account-bff';

export async function POST(request: NextRequest) {
  const denied = validateAuthMutation(request);
  if (denied) return denied;
  const refreshToken = request.cookies.get(TOKEN_CONFIG.refresh.cookieName)?.value;
  const parent = request.cookies.has(ACCOUNT_COOKIE) ? getAccountSessionRemaining(request) : undefined;
  const expiredSession = () => authJson({
    message: 'Session expired',
    code: typeof parent === 'number' && parent > 0 ? 'TENANT_SESSION_EXPIRED' : 'UNAUTHENTICATED',
  }, 401);
  if (!refreshToken || parent === null || parent === 0) {
    const result = expiredSession();
    clearTenantCookies(result);
    return result;
  }
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }), cache: 'no-store', redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      // A transient upstream failure must not destroy a valid rotating session.
      if (response.status !== 401 && response.status !== 403) {
        const result = authJson({ message: 'Authentication service is unavailable' }, response.status === 429 ? 429 : 502);
        const retry = response.headers.get('retry-after');
        if (retry && /^\d{1,6}$/.test(retry)) result.headers.set('Retry-After', retry);
        return result;
      }
      const result = expiredSession();
      clearTenantCookies(result);
      return result;
    }
    const data = await readJsonBody(response) as { accessToken?: unknown; refreshToken?: unknown } | null;
    const access = data?.accessToken;
    const refresh = isUsableToken(data?.refreshToken) ? data.refreshToken : refreshToken;
    const result = authJson({ success: true });
    if (!isUsableToken(access) || !setTenantAuthCookies(result, access, refresh, parent)) {
      return authJson({ message: 'Authentication service returned an unexpected response' }, 502);
    }
    return result;
  } catch {
    return authJson({ message: 'Authentication service is unavailable' }, 502);
  }
}
