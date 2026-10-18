import { NextRequest } from 'next/server';
import { BACKEND_URL } from '@/lib/server-env';
import { readJsonBody, messageFrom, isUsableToken } from '@/lib/auth/backend-response';
import { authJson, authCookieOptions, validateAuthMutation } from '@/lib/auth/auth-csrf';
import { ACCOUNT_COOKIE, ACCOUNT_EXPIRY_COOKIE, BINDING_COOKIE, revokeAccountSession, setTenantAuthCookies } from '@/lib/auth/account-bff';

/** Legacy phone login remains independent of account-auth feature flags. */
export async function POST(request: NextRequest) {
  const denied = validateAuthMutation(request);
  if (denied) return denied;
  let body;
  try { body = await request.json(); } catch { return authJson({ message: 'Malformed request body' }, 400); }
  const { phone, password, remember_me } = body ?? {};
  if (typeof phone !== 'string' || !/^\+[1-9]\d{7,14}$/.test(phone)
    || typeof password !== 'string' || password.length < 1 || password.length > 128
    || (remember_me !== undefined && typeof remember_me !== 'boolean')) {
    return authJson({ message: 'Phone number and password are required' }, 400);
  }
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      // LoginDto accepts only phone/password. Keep the legacy UI preference
      // local; cookie lifetimes follow the backend-issued JWT expiry.
      body: JSON.stringify({ phone, password }),
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15_000),
    });
    const data = await readJsonBody(response);
    if (!response.ok) return authJson({ message: messageFrom(data, 'Invalid credentials') }, response.status);
    const { accessToken, refreshToken, user } = (data ?? {}) as { accessToken?: unknown; refreshToken?: unknown; user?: unknown };
    if (!isUsableToken(accessToken) || !isUsableToken(refreshToken) || !user) {
      return authJson({ message: 'Authentication service returned an unexpected response' }, 502);
    }
    const result = authJson({ user });
    if (!setTenantAuthCookies(result, accessToken, refreshToken)) return authJson({ message: 'Authentication service returned an unexpected response' }, 502);
    // Signing in as a phone identity must not retain another account's session.
    await revokeAccountSession(request);
    for (const name of [ACCOUNT_COOKIE, ACCOUNT_EXPIRY_COOKIE, BINDING_COOKIE]) {
      result.cookies.set(name, '', { ...authCookieOptions(), maxAge: 0 });
    }
    return result;
  } catch {
    return authJson({ message: 'Authentication service is unavailable' }, 502);
  }
}
