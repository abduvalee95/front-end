import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('server-only', () => ({}));

import {
  ACCOUNT_COOKIE, ACCOUNT_EXPIRY_COOKIE, BINDING_COOKIE, PENDING_INVITATION_COOKIE,
  accountSessionRemaining, clearAccountCookies, handleAccountRequest, handleGoogleCallback,
  revokeAccountSession, tenantTokenMaxAge,
} from '@/lib/auth/account-bff';

const origin = 'https://app.example.com';
const secret = 'server-only-bff-secret-'.repeat(3);
const csrf = 'c'.repeat(43);
const opaque = 's'.repeat(43);
const binding = 'b'.repeat(43);
const linkToken = 't'.repeat(43);
const account = { id: 'account-1', email: 'user@example.com', full_name: 'Test User', email_verified: true };
const organizationId = '11111111-1111-4111-8111-111111111111';
const user = { id: 'user-1', full_name: 'Test User', organization_id: organizationId, role: 'ADMIN' };
const fetchMock = vi.fn<typeof fetch>();

function jwt(lifetime: number, extra = {}) {
  const encode = (data: unknown) => Buffer.from(JSON.stringify(data)).toString('base64url');
  return `${encode({ alg: 'HS256' })}.${encode({ exp: Math.floor(Date.now() / 1000) + lifetime, ...extra })}.signature`;
}
function session(expirySeconds = 30 * 86400) {
  return { account, accountSessionToken: opaque, expiresAt: new Date(Date.now() + expirySeconds * 1000).toISOString() };
}
function response(data: unknown, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}
function request(path: string, body: unknown = {}, cookies: Record<string, string> = {}, headers: Record<string, string> = {}, method = 'POST') {
  return new NextRequest(`${origin}/api/auth/accounts/${path}`, {
    method,
    headers: { Origin: origin, 'Content-Type': 'application/json', 'X-CSRF-Token': csrf,
      Cookie: Object.entries({ auth_csrf: csrf, ...cookies }).map(([key, value]) => `${key}=${value}`).join('; '), ...headers },
    ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
  });
}
async function call(path: string, body: unknown = {}, cookies = {}, headers = {}, method = 'POST') {
  return handleAccountRequest(request(path, body, cookies, headers, method), path.split('/'));
}
async function accountCookies(lifetime = 3600): Promise<Record<string, string>> {
  fetchMock.mockResolvedValueOnce(response(session(lifetime)));
  const result = await call('login', { email: 'user@example.com', password: 'password' });
  return { [ACCOUNT_COOKIE]: result.cookies.get(ACCOUNT_COOKIE)!.value, [ACCOUNT_EXPIRY_COOKIE]: result.cookies.get(ACCOUNT_EXPIRY_COOKIE)!.value };
}

describe('account BFF', () => {
  beforeEach(() => {
    vi.stubEnv('AUTH_APP_URL', origin);
    vi.stubEnv('AUTH_BFF_SECRET', secret);
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it('keeps email login account-only, strips all extra upstream fields and clears old tenant credentials', async () => {
    fetchMock.mockResolvedValueOnce(response({ ...session(), password_hash: 'private', account: { ...account, password_hash: 'private' } }));
    const result = await call('login', { email: 'user@example.com', password: 'password' }, { access_token: jwt(500), refresh_token: jwt(500) }, { Authorization: 'Bearer browser-attacker-token' });
    expect(await result.json()).toEqual({ account });
    const [, options] = fetchMock.mock.calls[0];
    expect(options).toMatchObject({ cache: 'no-store', redirect: 'error', headers: { 'X-Auth-BFF-Secret': secret } });
    expect(options?.headers).not.toHaveProperty('Authorization');
    expect(result.cookies.get(ACCOUNT_COOKIE)).toMatchObject({ value: opaque, httpOnly: true, secure: true, sameSite: 'lax' });
    expect(result.cookies.get(ACCOUNT_COOKIE)!.maxAge).toBeLessThanOrEqual(30 * 86400);
    expect(result.cookies.get('access_token')?.maxAge).toBe(0);
    expect(result.cookies.get('refresh_token')?.maxAge).toBe(0);
    expect(result.headers.get('Cache-Control')).toBe('no-store');
  });

  it.each([
    { accountSessionToken: 'short' }, { accountSessionToken: undefined },
    { expiresAt: 'invalid' }, { expiresAt: new Date(0).toISOString() }, { account: null },
  ])('rejects malformed session responses without setting credentials: %j', async override => {
    fetchMock.mockResolvedValueOnce(response({ ...session(), ...override }));
    const result = await call('login', { email: 'user@example.com', password: 'password' });
    expect(result.status).toBe(502);
    expect(result.cookies.get(ACCOUNT_COOKIE)).toBeUndefined();
  });

  it('clamps a longer upstream account expiry to thirty days', async () => {
    fetchMock.mockResolvedValueOnce(response(session(60 * 86400)));
    const result = await call('login', { email: 'user@example.com', password: 'password' });
    expect(result.cookies.get(ACCOUNT_COOKIE)!.maxAge).toBeLessThanOrEqual(30 * 86400);
  });

  it('revokes the previous browser account only after valid email credentials establish a new session', async () => {
    const previous = 'o'.repeat(43);
    fetchMock.mockResolvedValueOnce(response(session())).mockResolvedValueOnce(response({ success: true }));
    const result = await call('login', { email: 'user@example.com', password: 'password' }, { [ACCOUNT_COOKIE]: previous });
    expect(result.status).toBe(200);
    expect(fetchMock.mock.calls.map(([url]) => String(url).split('/').pop())).toEqual(['login', 'logout']);
    expect(fetchMock.mock.calls[1][1]?.headers).toMatchObject({ Authorization: `Bearer ${previous}` });
    expect(result.cookies.get(ACCOUNT_COOKIE)?.value).toBe(opaque);
  });

  it('does not revoke the existing account on rejected or malformed new email credentials', async () => {
    for (const upstream of [response({}, 401), response({ ...session(), accountSessionToken: 'invalid' })]) {
      fetchMock.mockClear(); fetchMock.mockResolvedValueOnce(upstream);
      const result = await call('login', { email: 'user@example.com', password: 'password' }, { [ACCOUNT_COOKIE]: 'o'.repeat(43) });
      expect([401, 502]).toContain(result.status);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.cookies.get(ACCOUNT_COOKIE)).toBeUndefined();
    }
  });

  it('rejects bad origin, missing CSRF, and binding injection before contacting backend', async () => {
    expect((await call('login', { email: 'user@example.com', password: 'password' }, {}, { Origin: 'https://evil.example.com' })).status).toBe(403);
    expect((await call('login', { email: 'user@example.com', password: 'password' }, {}, { 'X-CSRF-Token': '' })).status).toBe(403);
    expect((await call('register', { email: 'user@example.com', full_name: 'Test User', password: 'long-password', browser_binding: binding })).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('only allows fixed methods and paths, never arbitrary backend proxy paths', async () => {
    for (const path of ['google/callback', '../logout', 'users', 'constructor']) expect((await call(path)).status).toBe(404);
    expect((await call('login', {}, {}, {}, 'GET')).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('generates registration browser binding on the server and keeps email response generic', async () => {
    fetchMock.mockResolvedValueOnce(response({ message: 'upstream-sensitive-data', token: linkToken }));
    const result = await call('register', { email: 'user@example.com', full_name: 'Test User', password: 'long-password' });
    const sent = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
    expect(sent.browser_binding).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(result.cookies.get(BINDING_COOKIE)).toMatchObject({ value: sent.browser_binding, httpOnly: true, secure: true, maxAge: 1800 });
    expect(await result.json()).toEqual({ message: 'If eligible, check your email for the next step.' });
  });

  it('retains generated registration binding on an ambiguous transport failure for delivered verification email', async () => {
    fetchMock.mockRejectedValueOnce(new Error('connection closed'));
    const result = await call('register', { email: 'user@example.com', full_name: 'Test User', password: 'long-password' });
    expect(result.status).toBe(502);
    expect(result.cookies.get(BINDING_COOKIE)?.value).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('requires the original browser binding for verification and clears it only on success', async () => {
    expect((await call('verify-email', { token: linkToken })).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockResolvedValueOnce(response({ verified: true }));
    const result = await call('verify-email', { token: linkToken }, { [BINDING_COOKIE]: binding });
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toEqual({ token: linkToken, browser_binding: binding });
    expect(await result.json()).toEqual({ verified: true });
    expect(result.cookies.get(BINDING_COOKIE)?.maxAge).toBe(0);
  });

  it('uses the account bearer to read safe membership information and excludes session/DB fields', async () => {
    fetchMock.mockResolvedValueOnce(response({ account: { ...account, password_hash: 'private' }, memberships: [{ organization_id: organizationId, role: 'ADMIN', organization: { name: 'Center', status: 'ACTIVE', private: true }, account_id: 'private' }], onboardingRequired: false, accountSessionToken: opaque }));
    const result = await call('me', {}, { [ACCOUNT_COOKIE]: opaque, access_token: jwt(500) }, {}, 'GET');
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ Authorization: `Bearer ${opaque}` });
    expect(await result.json()).toEqual({ account, memberships: [{ organization_id: organizationId, role: 'ADMIN', organization: { name: 'Center', status: 'ACTIVE' } }], onboardingRequired: false });
  });

  it('requires account authentication and never accepts a browser Authorization header', async () => {
    expect((await call('centers', { name: 'Center', phone: '+998901234567' }, {}, { Authorization: `Bearer ${opaque}` })).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('selects an organization using the account bearer and bounds tenant cookies to JWT and parent expiries', async () => {
    const cookies = await accountCookies(120);
    const accessToken = jwt(900), refreshToken = jwt(7 * 86400);
    fetchMock.mockResolvedValueOnce(response({ user: { ...user, password: 'private' }, accessToken, refreshToken }));
    const result = await call('select-organization', { organization_id: organizationId }, cookies);
    expect(fetchMock.mock.calls[1][1]?.headers).toMatchObject({ Authorization: `Bearer ${opaque}` });
    expect(await result.json()).toEqual({ user: { ...user, is_active: true } });
    expect(result.cookies.get('access_token')).toMatchObject({ value: accessToken, httpOnly: true, secure: true });
    expect(result.cookies.get('refresh_token')!.maxAge).toBeLessThanOrEqual(120);
    expect(result.cookies.get('access_token')!.maxAge).toBeLessThanOrEqual(120);
    expect(result.cookies.get(ACCOUNT_COOKIE)).toBeUndefined();
  });

  it('rejects missing or forged parent expiry before creating a tenant session', async () => {
    const cookies = await accountCookies();
    fetchMock.mockClear();
    expect((await call('select-organization', { organization_id: organizationId }, { [ACCOUNT_COOKIE]: opaque })).status).toBe(401);
    expect((await call('select-organization', { organization_id: organizationId }, { ...cookies, [ACCOUNT_EXPIRY_COOKIE]: `${Date.now() + 86400000}.${'a'.repeat(43)}` })).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(accountSessionRemaining(request('me', {}, cookies))).toBeGreaterThan(3500);
  });

  it('uses only tenant bearer for invitation creation and never returns an invitation token', async () => {
    const tenant = jwt(500);
    fetchMock.mockResolvedValueOnce(response({ invitation_id: 'invitation-1', expires_at: '2026-11-01', token: linkToken }));
    const result = await call('invitations', { email: 'invitee@example.com', role: 'TEACHER' }, { [ACCOUNT_COOKIE]: opaque, access_token: tenant });
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ Authorization: `Bearer ${tenant}` });
    expect(await result.json()).toEqual({ invitation_id: 'invitation-1', expires_at: '2026-11-01' });
    expect((await call('invitations', { email: 'invitee@example.com', role: 'ADMIN' }, { access_token: tenant })).status).toBe(400);
  });

  it('stores a pending invitation only on explicit CSRF-protected POST, keeps GET read-only, then accepts and clears it', async () => {
    const stored = await call('pending-invitation', { token: linkToken });
    expect(await stored.json()).toEqual({ pending: true });
    expect(stored.cookies.get(PENDING_INVITATION_COOKIE)).toMatchObject({ value: linkToken, httpOnly: true, secure: true, maxAge: 7 * 86400 });
    const cookies = { [PENDING_INVITATION_COOKIE]: linkToken, [ACCOUNT_COOKIE]: opaque };
    const get = await call('pending-invitation', {}, cookies, {}, 'GET');
    expect(await get.json()).toEqual({ pending: true });
    expect(get.headers.get('Set-Cookie')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockResolvedValueOnce(response({ organization_id: organizationId }));
    const accepted = await call('accept-invitation', { phone: '+998901234567' }, cookies);
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toEqual({ phone: '+998901234567', token: linkToken });
    expect(accepted.cookies.get(PENDING_INVITATION_COOKIE)?.maxAge).toBe(0);
    expect(await accepted.json()).toEqual({ organization_id: organizationId });
  });

  it.each([400, 401, 403, 404, 409, 429, 503])('preserves safe backend status %i without reflecting sensitive upstream messages', async status => {
    fetchMock.mockResolvedValueOnce(response({ message: `${secret} ${opaque}` }, status, { 'Retry-After': '25' }));
    const result = await call('login', { email: 'user@example.com', password: 'password' });
    expect(result.status).toBe(status);
    const body = await result.text();
    expect(body).not.toContain(secret);
    expect(body).not.toContain(opaque);
    expect(result.cookies.get(ACCOUNT_COOKIE)).toBeUndefined();
    if (status === 429) expect(result.headers.get('Retry-After')).toBe('25');
  });

  it('does not erase credentials for transient backend errors', async () => {
    fetchMock.mockResolvedValueOnce(response({}, 500));
    const result = await call('me', {}, { [ACCOUNT_COOKIE]: opaque }, {}, 'GET');
    expect(result.status).toBe(502);
    expect(result.headers.get('Set-Cookie')).toBeNull();
  });

  it('uses a bounded timeout and maps timeout failures without logging or leaking backend details', async () => {
    fetchMock.mockRejectedValueOnce(new DOMException('secret backend URL', 'TimeoutError'));
    const result = await call('login', { email: 'user@example.com', password: 'password' });
    expect(result.status).toBe(504);
    expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
    expect(await result.text()).not.toContain('secret backend URL');
  });

  it('fails closed without a server-only BFF secret', async () => {
    vi.stubEnv('AUTH_BFF_SECRET', '');
    expect((await call('login', { email: 'user@example.com', password: 'password' })).status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('clears all associated credentials on password reset success, retaining them on failure', async () => {
    fetchMock.mockResolvedValueOnce(response({ success: true }));
    const result = await call('reset-password', { token: linkToken, password: 'long-password' });
    for (const name of [ACCOUNT_COOKIE, ACCOUNT_EXPIRY_COOKIE, BINDING_COOKIE, PENDING_INVITATION_COOKIE, 'access_token', 'refresh_token']) expect(result.cookies.get(name)?.maxAge).toBe(0);
    fetchMock.mockResolvedValueOnce(response({}, 400));
    expect((await call('reset-password', { token: linkToken, password: 'long-password' })).headers.get('Set-Cookie')).toBeNull();
  });

  it('revokes account session server-side and clears cookies on explicit logout even when backend is unavailable', async () => {
    fetchMock.mockResolvedValueOnce(response({}, 503));
    const result = await call('logout', {}, { [ACCOUNT_COOKIE]: opaque });
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ Authorization: `Bearer ${opaque}` });
    expect(result.cookies.get(ACCOUNT_COOKIE)?.maxAge).toBe(0);
    expect(result.cookies.get('access_token')?.maxAge).toBe(0);
    fetchMock.mockResolvedValueOnce(response({ success: true }));
    await expect(revokeAccountSession(request('logout', {}, { [ACCOUNT_COOKIE]: opaque }))).resolves.toBeUndefined();
    const local = NextResponse.json({});
    clearAccountCookies(local);
    expect(local.cookies.get(PENDING_INVITATION_COOKIE)?.maxAge).toBe(0);
  });

  it('derives cookie lifetime only from valid bounded JWT expiries', () => {
    expect(tenantTokenMaxAge(jwt(3600), 900)).toBeLessThanOrEqual(900);
    expect(tenantTokenMaxAge(jwt(3600), 900, 60)).toBeLessThanOrEqual(60);
    expect(tenantTokenMaxAge(jwt(-10), 900)).toBeNull();
    expect(tenantTokenMaxAge('not-a-token', 900)).toBeNull();
    expect(tenantTokenMaxAge(jwt(3600, { exp: '1000' }), 900)).toBeNull();
  });
});

describe('Google BFF flow', () => {
  beforeEach(() => {
    vi.stubEnv('AUTH_APP_URL', origin); vi.stubEnv('AUTH_BFF_SECRET', secret); vi.stubEnv('NODE_ENV', 'production');
    vi.stubGlobal('fetch', fetchMock); fetchMock.mockReset();
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  function callback(query: string, cookies = `${BINDING_COOKIE}=${binding}`) {
    return new NextRequest(`${origin}/api/auth/google/callback?${query}`, { headers: { Cookie: cookies } });
  }

  it('starts Google with generated binding and allows only Google HTTPS authorization URLs', async () => {
    fetchMock.mockResolvedValueOnce(response({ authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?state=test' }));
    const result = await call('google/start');
    expect(result.cookies.get(BINDING_COOKIE)?.value).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(await result.json()).toMatchObject({ authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?state=test' });
    for (const authorizationUrl of ['https://accounts.google.com.evil.test/auth', 'http://accounts.google.com/auth', 'https://user:pass@accounts.google.com/auth', 'javascript:alert(1)']) {
      fetchMock.mockResolvedValueOnce(response({ authorizationUrl }));
      expect((await call('google/start')).status).toBe(502);
    }
  });

  it('uses account auth for explicit Google identity linking', async () => {
    fetchMock.mockResolvedValueOnce(response({ authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth' }));
    expect((await call('google/link', {}, { [ACCOUNT_COOKIE]: opaque })).status).toBe(200);
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ Authorization: `Bearer ${opaque}` });
  });

  it('exchanges Google code/state server-side, installs only account session, and redirects locally without query secrets', async () => {
    fetchMock.mockResolvedValueOnce(response(session()));
    const result = await handleGoogleCallback(callback(`code=google-private-code&state=${linkToken}&next=https://evil.test`));
    expect(result.status).toBe(303);
    expect(result.headers.get('Location')).toBe(`${origin}/onboarding`);
    expect(result.headers.get('Cache-Control')).toBe('no-store');
    expect(result.cookies.get(ACCOUNT_COOKIE)?.value).toBe(opaque);
    expect(result.cookies.get('access_token')?.maxAge).toBe(0);
    expect(result.cookies.get(BINDING_COOKIE)?.maxAge).toBe(0);
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toEqual({ code: 'google-private-code', state: linkToken, browser_binding: binding });
    expect(result.headers.get('Location')).not.toContain('google-private-code');
  });

  it('returns to a pending invitation after Google account login', async () => {
    fetchMock.mockResolvedValueOnce(response(session()));
    const result = await handleGoogleCallback(callback(`code=private&state=${linkToken}`, `${BINDING_COOKIE}=${binding}; ${PENDING_INVITATION_COOKIE}=${linkToken}`));
    expect(result.headers.get('Location')).toBe(`${origin}/accept-invitation`);
    expect(result.cookies.get(PENDING_INVITATION_COOKIE)).toBeUndefined();
  });

  it('revokes the previous browser account after a valid new Google session, but not on failed callback credentials', async () => {
    const previous = 'o'.repeat(43);
    const cookies = `${BINDING_COOKIE}=${binding}; ${ACCOUNT_COOKIE}=${previous}`;
    fetchMock.mockResolvedValueOnce(response(session())).mockResolvedValueOnce(response({ success: true }));
    const result = await handleGoogleCallback(callback(`code=private&state=${linkToken}`, cookies));
    expect(result.cookies.get(ACCOUNT_COOKIE)?.value).toBe(opaque);
    expect(fetchMock.mock.calls.map(([url]) => String(url).split('/').pop())).toEqual(['callback', 'logout']);
    expect(fetchMock.mock.calls[1][1]?.headers).toMatchObject({ Authorization: `Bearer ${previous}` });
    fetchMock.mockClear(); fetchMock.mockResolvedValueOnce(response({ ...session(), expiresAt: 'invalid' }));
    expect((await handleGoogleCallback(callback(`code=private&state=${linkToken}`, cookies))).headers.get('Location')).toContain('auth_error=unavailable');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('handles linked:true without installing or erasing the existing tenant credentials', async () => {
    fetchMock.mockResolvedValueOnce(response({ linked: true }));
    const result = await handleGoogleCallback(callback(`code=private&state=${linkToken}`, `${BINDING_COOKIE}=${binding}; ${ACCOUNT_COOKIE}=${opaque}`));
    expect(result.headers.get('Location')).toBe(`${origin}/onboarding?google_linked=1`);
    expect(result.cookies.get(ACCOUNT_COOKIE)).toBeUndefined();
    expect(result.cookies.get('access_token')).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects missing binding or duplicated callback parameters without calling backend', async () => {
    for (const req of [callback(`code=private&state=${linkToken}`, ''), callback(`code=private&state=${linkToken}&state=${linkToken}`), callback('error=access_denied'), callback(`code=one&code=two&state=${linkToken}`)]) {
      const result = await handleGoogleCallback(req);
      expect(result.headers.get('Location')).toBe(`${origin}/login?auth_error=invalid_callback`);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps provider conflicts to a safe enum redirect instead of backend messages or codes', async () => {
    fetchMock.mockResolvedValueOnce(response({ message: `${secret} ${opaque}` }, 409));
    const result = await handleGoogleCallback(callback(`code=private&state=${linkToken}`));
    expect(result.headers.get('Location')).toBe(`${origin}/login?auth_error=identity_conflict`);
    expect(result.cookies.get(ACCOUNT_COOKIE)).toBeUndefined();
  });
});
