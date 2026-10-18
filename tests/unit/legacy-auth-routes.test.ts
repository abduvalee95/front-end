import { createHmac, randomBytes } from 'node:crypto';
import { NextRequest, type NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/server-env', () => ({ BACKEND_URL: 'https://backend.test' }));
vi.mock('@/lib/logger', () => ({ serverLogger: { error: vi.fn() } }));

import { POST as login } from '@/app/api/auth/login/route';
import { POST as refresh } from '@/app/api/auth/refresh/route';
import { POST as logout } from '@/app/api/auth/logout/route';
import { GET as me } from '@/app/api/auth/me/route';

const ORIGIN = 'https://app.test';
const BFF_SECRET = 'unit-test-bff-secret-with-at-least-32-characters';
const NOW = 1_800_000_000;
const ACCOUNT = randomBytes(32).toString('base64url');
const CSRF = randomBytes(32).toString('base64url');
const user = { id: 'legacy-user', full_name: 'Phone User', role: 'ADMIN', organization_id: 'center-1' };
const fetchMock = vi.fn<typeof fetch>();

function jwt(seconds: number, extra: Record<string, unknown> = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: user.id, exp: NOW + seconds, ...extra })).toString('base64url');
  return `${header}.${payload}.unitTestSignature`;
}

function json(data: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

function request(path: string, options: {
  method?: 'GET' | 'POST'; body?: unknown; cookies?: Record<string, string>; headers?: Record<string, string>;
} = {}) {
  const method = options.method ?? 'POST';
  const cookies = { auth_csrf: CSRF, ...options.cookies };
  return new NextRequest(`${ORIGIN}/api/auth/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json', Origin: ORIGIN, 'X-CSRF-Token': CSRF,
      Cookie: Object.entries(cookies).map(([name, value]) => `${name}=${value}`).join('; '),
      ...options.headers,
    },
    body: method === 'GET' ? undefined : JSON.stringify(options.body ?? {}),
  });
}

function parentCookies(seconds: number) {
  const timestamp = String((NOW + seconds) * 1000);
  const signature = createHmac('sha256', BFF_SECRET).update(`${ACCOUNT}.${timestamp}`).digest('base64url');
  return { account_session: ACCOUNT, account_session_expires: `${timestamp}.${signature}` };
}

function expectCleared(response: NextResponse, names: string[]) {
  for (const name of names) {
    expect(response.cookies.get(name), name).toMatchObject({ value: '', maxAge: 0, httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
  }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW * 1000);
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('AUTH_APP_URL', ORIGIN);
  vi.stubEnv('AUTH_BFF_SECRET', BFF_SECRET);
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('legacy phone login through the BFF', () => {
  it('keeps the phone endpoint usable when account auth is disabled and has no BFF secret', async () => {
    vi.stubEnv('AUTH_BFF_SECRET', '');
    vi.stubEnv('ACCOUNT_AUTH_ENABLED', 'false');
    const accessToken = jwt(90);
    const refreshToken = jwt(3600);
    fetchMock.mockResolvedValueOnce(json({ accessToken, refreshToken, user }));

    const response = await login(request('login', {
      body: { phone: '+996700000001', password: 'test-only-phone-password', remember_me: true },
    }));

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://backend.test/api/auth/login');
    expect(init).toMatchObject({ method: 'POST', cache: 'no-store', redirect: 'error' });
    expect(new Headers(init?.headers).get('X-Auth-BFF-Secret')).toBeNull();
    expect(JSON.parse(init?.body as string)).toEqual({ phone: '+996700000001', password: 'test-only-phone-password' });
    expect(await response.json()).toEqual({ user });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.cookies.get('access_token')).toMatchObject({ value: accessToken, maxAge: 90, httpOnly: true, secure: true, sameSite: 'lax' });
    expect(response.cookies.get('refresh_token')).toMatchObject({ value: refreshToken, maxAge: 3600, httpOnly: true, secure: true, sameSite: 'lax' });
    expectCleared(response, ['account_session', 'account_session_expires', 'auth_browser_binding']);
  });

  it('revokes the preceding account identity before returning the phone identity', async () => {
    fetchMock.mockResolvedValueOnce(json({ accessToken: jwt(3600), refreshToken: jwt(30 * 86400), user }));
    fetchMock.mockResolvedValueOnce(json({ success: true }));
    const response = await login(request('login', {
      body: { phone: '+996700000001', password: 'test-only-phone-password' }, cookies: parentCookies(1000),
    }));

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('https://backend.test/api/auth/accounts/logout');
    expect(new Headers(init?.headers).get('Authorization')).toBe(`Bearer ${ACCOUNT}`);
    expect(new Headers(init?.headers).get('X-Auth-BFF-Secret')).toBe(BFF_SECRET);
    expect(response.cookies.get('access_token')?.maxAge).toBe(900);
    expect(response.cookies.get('refresh_token')?.maxAge).toBe(7 * 86400);
    expectCleared(response, ['account_session', 'account_session_expires', 'auth_browser_binding']);
    expect(await response.json()).toEqual({ user });
  });

  it.each(['not-a-jwt', jwt(-1), jwt(100, { exp: null })])('does not install malformed or expired backend tokens (%s)', async accessToken => {
    fetchMock.mockResolvedValueOnce(json({ accessToken, refreshToken: jwt(1000), user }));
    const response = await login(request('login', { body: { phone: '+996700000001', password: 'test-only-password' } }));
    expect(response.status).toBe(502);
    expect(response.cookies.getAll()).toEqual([]);
    expect(await response.text()).not.toContain(accessToken);
  });

  it('rejects invalid phone credentials before reaching the backend', async () => {
    const response = await login(request('login', { body: { phone: '700000001', password: '' } }));
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('CSRF protection on all legacy auth mutations', () => {
  it.each([
    ['login', login], ['refresh', refresh], ['logout', logout],
  ] as const)('rejects cross-origin %s before any session operation', async (path, handler) => {
    const response = await handler(request(path, {
      body: { phone: '+996700000001', password: 'test-only-password' },
      cookies: { ...parentCookies(1000), access_token: jwt(900), refresh_token: jwt(3600) },
      headers: { Origin: 'https://attacker.test' },
    }));
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: 'CSRF_INVALID' });
    expect(response.cookies.getAll()).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a mismatched double-submit token even from the trusted origin', async () => {
    const response = await refresh(request('refresh', {
      cookies: { refresh_token: jwt(3600) }, headers: { 'X-CSRF-Token': randomBytes(32).toString('base64url') },
    }));
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('tenant refresh route', () => {
  it('rotates both HttpOnly cookies and limits them to their parent account lifetime', async () => {
    const accessToken = jwt(3600);
    const refreshToken = jwt(7 * 86400);
    const oldRefresh = jwt(1000, { jti: 'previous' });
    fetchMock.mockResolvedValueOnce(json({ accessToken, refreshToken }));
    const response = await refresh(request('refresh', { cookies: { ...parentCookies(120), refresh_token: oldRefresh } }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string)).toEqual({ refreshToken: oldRefresh });
    expect(response.cookies.get('access_token')).toMatchObject({ value: accessToken, maxAge: 120, httpOnly: true, secure: true });
    expect(response.cookies.get('refresh_token')).toMatchObject({ value: refreshToken, maxAge: 120, httpOnly: true, secure: true });
  });

  it('supports legacy refresh replies that omit a replacement refresh token', async () => {
    const oldRefresh = jwt(1800);
    fetchMock.mockResolvedValueOnce(json({ accessToken: jwt(90) }));
    const response = await refresh(request('refresh', { cookies: { refresh_token: oldRefresh } }));
    expect(response.status).toBe(200);
    expect(response.cookies.get('refresh_token')).toMatchObject({ value: oldRefresh, maxAge: 1800 });
  });

  it.each([
    ['expired', () => parentCookies(-1)],
    ['missing signed expiry', () => ({ account_session: ACCOUNT })],
    ['forged signed expiry', () => ({ ...parentCookies(1000), account_session_expires: `${(NOW + 1000) * 1000}.${randomBytes(32).toString('base64url')}` })],
  ])('denies an %s parent before sending a rotating refresh token', async (_label, cookies) => {
    const response = await refresh(request('refresh', { cookies: { ...cookies(), refresh_token: jwt(3600) } }));
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
    expectCleared(response, ['access_token', 'refresh_token']);
  });

  it.each([401, 403])('clears rejected tenant cookies on backend %i', async status => {
    fetchMock.mockResolvedValueOnce(json({ message: 'Denied' }, status));
    const response = await refresh(request('refresh', { cookies: { ...parentCookies(1000), refresh_token: jwt(3600) } }));
    expect(response.status).toBe(401);
    expectCleared(response, ['access_token', 'refresh_token']);
    expect(response.cookies.get('account_session')).toBeUndefined();
    expect(await response.json()).toMatchObject({ code: 'TENANT_SESSION_EXPIRED' });
  });

  it('retains the account stage when the child refresh cookie has expired', async () => {
    const response = await refresh(request('refresh', { cookies: parentCookies(1000) }));
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ code: 'TENANT_SESSION_EXPIRED' });
    expect(response.cookies.get('account_session')).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('requires a full sign-in when a legacy refresh is rejected', async () => {
    fetchMock.mockResolvedValueOnce(json({}, 401));
    const response = await refresh(request('refresh', { cookies: { refresh_token: jwt(3600) } }));
    expect(await response.json()).toMatchObject({ code: 'UNAUTHENTICATED' });
    expectCleared(response, ['access_token', 'refresh_token']);
  });

  it('preserves usable cookies when the backend is temporarily unavailable', async () => {
    fetchMock.mockResolvedValueOnce(json({ message: 'Internal provider details' }, 503));
    const response = await refresh(request('refresh', { cookies: { refresh_token: jwt(3600) } }));
    expect(response.status).toBe(502);
    expect(response.cookies.getAll()).toEqual([]);
    expect(await response.text()).not.toContain('Internal provider details');
  });

  it('preserves cookies after a transport failure', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('network unavailable'));
    const response = await refresh(request('refresh', { cookies: { refresh_token: jwt(3600) } }));
    expect(response.status).toBe(502);
    expect(response.cookies.getAll()).toEqual([]);
  });

  it('forwards a bounded Retry-After without clearing cookies on rate limits', async () => {
    fetchMock.mockResolvedValueOnce(json({}, 429, { 'Retry-After': '45' }));
    const response = await refresh(request('refresh', { cookies: { refresh_token: jwt(3600) } }));
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('45');
    expect(response.cookies.getAll()).toEqual([]);
  });
});

describe('combined logout route', () => {
  it.each([false, true])('revokes account and tenant sessions and clears all credentials (upstream fails: %s)', async unavailable => {
    const access = jwt(900);
    if (unavailable) fetchMock.mockRejectedValue(new TypeError('network unavailable'));
    else fetchMock.mockImplementation(async () => json({ success: true }));
    const response = await logout(request('logout', { cookies: {
      ...parentCookies(1000), access_token: access, refresh_token: jwt(3600),
      auth_browser_binding: randomBytes(32).toString('base64url'), auth_invitation: randomBytes(32).toString('base64url'),
    } }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const accountCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/accounts/logout'));
    const tenantCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/api/auth/logout'));
    expect(accountCall).toBeDefined();
    expect(tenantCall).toBeDefined();
    expect(new Headers(accountCall?.[1]?.headers).get('Authorization')).toBe(`Bearer ${ACCOUNT}`);
    expect(new Headers(accountCall?.[1]?.headers).get('X-Auth-BFF-Secret')).toBe(BFF_SECRET);
    expect(new Headers(tenantCall?.[1]?.headers).get('Authorization')).toBe(`Bearer ${access}`);
    expect(new Headers(tenantCall?.[1]?.headers).get('X-Auth-BFF-Secret')).toBeNull();
    expectCleared(response, ['account_session', 'account_session_expires', 'auth_browser_binding', 'auth_invitation', 'access_token', 'refresh_token']);
  });
});

describe('legacy tenant profile route', () => {
  it('returns 401 JSON when only an account session is present', async () => {
    const response = await me(request('me', { method: 'GET', cookies: parentCookies(1000) }));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: 'Not authenticated' });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([user, { user }])('fetches the tenant profile with the HttpOnly access token', async data => {
    const access = jwt(900);
    fetchMock.mockResolvedValueOnce(json(data));
    const response = await me(request('me', { method: 'GET', cookies: { access_token: access } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user, canSelectOrganization: false });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://backend.test/api/auth/me');
    expect(new Headers(init?.headers).get('Authorization')).toBe(`Bearer ${access}`);
    expect(init).toMatchObject({ cache: 'no-store', redirect: 'error' });
  });

  it('offers center selection only while the signed account parent is valid', async () => {
    fetchMock.mockResolvedValueOnce(json(user));
    const response = await me(request('me', {
      method: 'GET', cookies: { ...parentCookies(120), access_token: jwt(900) },
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user, canSelectOrganization: true });
  });

  it.each([
    ['expired', () => parentCookies(-1)],
    ['forged', () => ({ ...parentCookies(120), account_session_expires: `${(NOW + 120) * 1000}.${randomBytes(32).toString('base64url')}` })],
  ])('does not offer center selection for an %s account parent', async (_label, cookies) => {
    fetchMock.mockResolvedValueOnce(json(user));
    const response = await me(request('me', {
      method: 'GET', cookies: { ...cookies(), access_token: jwt(900) },
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user, canSelectOrganization: false });
  });

  it('keeps a backend authentication rejection as 401 rather than a login-page redirect', async () => {
    fetchMock.mockResolvedValueOnce(json({}, 401));
    const response = await me(request('me', { method: 'GET', cookies: { access_token: jwt(900) } }));
    expect(response.status).toBe(401);
    expect(response.headers.get('Location')).toBeNull();
    expect(await response.json()).toEqual({ message: 'Session expired' });
  });
});
