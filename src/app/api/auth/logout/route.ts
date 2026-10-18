import { NextRequest } from 'next/server';
import { BACKEND_URL } from '@/lib/server-env';
import { TOKEN_CONFIG } from '@/lib/auth/token-config';
import { clearAccountCookies, revokeAccountSession } from '@/lib/auth/account-bff';
import { authJson, validateAuthMutation } from '@/lib/auth/auth-csrf';

export async function POST(request: NextRequest) {
  const denied = validateAuthMutation(request);
  if (denied) return denied;
  const access = request.cookies.get(TOKEN_CONFIG.access.cookieName)?.value;
  await Promise.allSettled([
    revokeAccountSession(request),
    access ? fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: 'POST', headers: { Authorization: `Bearer ${access}` },
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10_000),
    }) : Promise.resolve(),
  ]);
  const response = authJson({ success: true });
  clearAccountCookies(response);
  return response;
}
