import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('server-only', () => ({}));

import { CSRF_COOKIE, issueAuthCsrf, trustedAuthOrigin, validateAuthMutation } from '@/lib/auth/auth-csrf';

const token = 'c'.repeat(43);
const origin = 'https://app.example.com';
function request(headers: Record<string, string> = {}, method = 'POST') {
  return new NextRequest(`${origin}/api/auth/login`, {
    method, headers: { Origin: origin, Cookie: `${CSRF_COOKIE}=${token}`, 'X-CSRF-Token': token, ...headers },
  });
}

describe('auth CSRF boundary', () => {
  beforeEach(() => { vi.stubEnv('AUTH_APP_URL', origin); vi.stubEnv('NODE_ENV', 'production'); });
  afterEach(() => vi.unstubAllEnvs());

  it('accepts a matching trusted origin and double-submit token', () => {
    expect(validateAuthMutation(request())).toBeNull();
  });

  it.each<Record<string, string>>([
    { Origin: 'https://evil.example.com' },
    { Origin: 'null' },
    { Origin: '' },
    { 'X-CSRF-Token': 'different'.repeat(6) },
    { Cookie: '' },
    { 'Sec-Fetch-Site': 'cross-site' },
  ])('rejects unsafe requests: %j', async headers => {
    const response = validateAuthMutation(request(headers));
    expect(response?.status).toBe(403);
    expect(await response?.json()).toMatchObject({ code: 'CSRF_INVALID' });
    expect(response?.headers.get('Cache-Control')).toBe('no-store');
  });

  it('rejects a missing Origin even with matching cookies', () => {
    const req = request();
    req.headers.delete('Origin');
    expect(validateAuthMutation(req)?.status).toBe(403);
  });

  it('ignores attacker-supplied forwarded origin headers', () => {
    const req = request({ Origin: 'https://evil.example.com', 'X-Forwarded-Host': 'evil.example.com', 'X-Forwarded-Proto': 'https' });
    expect(trustedAuthOrigin(req)).toBe(origin);
    expect(validateAuthMutation(req)?.status).toBe(403);
  });

  it('uses the request URL origin when the public URL is unset', () => {
    vi.stubEnv('AUTH_APP_URL', '');
    expect(validateAuthMutation(request())).toBeNull();
  });

  it('fails closed when AUTH_APP_URL is malformed', () => {
    vi.stubEnv('AUTH_APP_URL', 'not a URL');
    expect(validateAuthMutation(request())?.status).toBe(403);
  });

  it('issues a reusable, host-only, secure HttpOnly CSRF cookie and a no-store response', async () => {
    const req = new NextRequest(`${origin}/api/auth/csrf`);
    const response = issueAuthCsrf(req);
    const { csrfToken } = await response.json();
    expect(csrfToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(response.cookies.get(CSRF_COOKIE)).toMatchObject({ value: csrfToken, httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 86400 });
    expect(response.headers.get('Set-Cookie')).not.toContain('Domain=');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect((await issueAuthCsrf(request({}, 'GET')).json()).csrfToken).toBe(token);
  });

  it('refuses cross-site token issuance', () => {
    expect(issueAuthCsrf(request({ Origin: 'https://evil.example.com' }, 'GET')).status).toBe(403);
    expect(issueAuthCsrf(request({ 'Sec-Fetch-Site': 'cross-site' }, 'GET')).status).toBe(403);
  });
});
