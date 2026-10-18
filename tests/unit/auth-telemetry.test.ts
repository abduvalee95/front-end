import { describe, expect, it } from 'vitest';
import { filterAuthBreadcrumb, filterAuthTelemetry, isSensitiveAuthUrl } from '@/lib/auth/telemetry';

const secret = 'private-BFF-value';
const token = 'private-opaque-session-token';
const googleCode = 'private-google-authorization-code';
const password = 'private-password-value';

describe('authentication telemetry privacy', () => {
  it.each([
    'https://app.test/api/auth/google/callback?code=private&state=private',
    '/api/auth/accounts/login', '/api/auth/refresh', '/api/auth/csrf',
    'https://app.test/verify-email#token=private', '/reset-password#token=private',
    '/accept-invitation#token=private', '/login', '/register', '/forgot-password',
    '/onboarding/create-center', '/api/%61uth/google/callback?code=private',
  ])('drops events and transactions associated with sensitive URLs: %s', url => {
    expect(isSensitiveAuthUrl(url)).toBe(true);
    expect(filterAuthTelemetry({ request: { url }, extra: { information: 'other' } })).toBeNull();
    expect(filterAuthTelemetry({ transaction: `GET ${url}` })).toBeNull();
    expect(filterAuthTelemetry({ contexts: { trace: { data: { 'url.full': url } } } })).toBeNull();
  });

  it('scrubs actual leaked credentials, headers, request bodies and bearer fragments without changing the original event', () => {
    const event = {
      request: { url: `https://app.test/payments?code=${googleCode}#token=${token}`,
        headers: { Authorization: `Bearer ${token}`, COOKIE: `account_session=${token}`, 'Set-Cookie': `access_token=${token}`, 'x-AuTh-bFf-SeCrEt': secret, Accept: 'application/json' },
        data: JSON.stringify({ password, token }), query_string: `code=${googleCode}`,
      },
      extra: { accountSessionToken: token, AUTH_BFF_SECRET: secret, browser_binding: token, request_body: password,
        url: `https://accounts.google.com/o/oauth2/auth?code=${googleCode}#token=${token}` },
      message: `A request failed with Bearer ${token}`,
    };
    const original = structuredClone(event);
    const safe = filterAuthTelemetry(event);
    expect(safe).not.toBeNull();
    const output = JSON.stringify(safe);
    for (const privateValue of [secret, token, googleCode, password]) expect(output).not.toContain(privateValue);
    expect(safe?.request.url).toBe('https://app.test/payments');
    expect(safe?.request.headers.Accept).toBe('application/json');
    expect(safe?.request).not.toHaveProperty('data');
    expect(safe?.request).not.toHaveProperty('query_string');
    expect(event).toEqual(original);
  });

  it('removes auth breadcrumbs and spans while retaining useful non-auth diagnostics', () => {
    const event = {
      transaction: '/dashboard',
      breadcrumbs: [
        { category: 'fetch', data: { url: `https://app.test/api/auth/google/callback?code=${googleCode}` } },
        { category: 'navigation', data: { from: `/verify-email#token=${token}`, to: '/dashboard' } },
        { category: 'fetch', data: { url: '/api/proxy/students', Authorization: `Bearer ${token}` } },
      ],
      spans: [
        { description: 'POST /api/auth/accounts/login', data: { password } },
        { description: 'HTTP GET', data: { 'url.full': `/api/auth/google/callback?code=${googleCode}` } },
        { description: 'GET /api/proxy/students', data: { 'http.request.header.cookie': `access_token=${token}`, 'http.request.body': password } },
      ],
    };
    const safe = filterAuthTelemetry(event);
    expect(safe?.breadcrumbs).toHaveLength(1);
    expect(safe?.spans).toHaveLength(1);
    expect(safe?.spans[0].description).toBe('GET /api/proxy/students');
    for (const privateValue of [token, password, googleCode]) expect(JSON.stringify(safe)).not.toContain(privateValue);
  });

  it('rejects sensitive standalone breadcrumbs before they can enter the buffer', () => {
    expect(filterAuthBreadcrumb({ category: 'fetch', data: { url: `/api/auth/accounts/login?token=${token}` } })).toBeNull();
    expect(filterAuthBreadcrumb({ message: `GET https://app.test/api/auth/google/callback?code=${googleCode}` })).toBeNull();
    const safe = filterAuthBreadcrumb({ category: 'fetch', data: { url: `/api/proxy/students?token=${token}`, Authorization: `Bearer ${token}` } });
    expect(safe).not.toBeNull();
    expect(JSON.stringify(safe)).not.toContain(token);
  });

  it('bounds recursive or excessively nested custom contexts instead of throwing', () => {
    const cycle: Record<string, unknown> = { password };
    cycle.self = cycle;
    const safe = filterAuthTelemetry({ contexts: { cycle }, transaction: '/dashboard' });
    expect(JSON.stringify(safe)).not.toContain(password);
    expect(JSON.stringify(safe)).toContain('[redacted]');
  });

  it('preserves ordinary error and transaction fields', () => {
    const event = { transaction: '/students', level: 'error', message: 'Student lookup failed', request: { url: 'https://app.test/students', method: 'GET' } };
    expect(filterAuthTelemetry(event)).toEqual(event);
  });
});
