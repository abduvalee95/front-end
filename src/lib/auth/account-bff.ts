import 'server-only';

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/server-env';
import { TOKEN_CONFIG } from '@/lib/auth/token-config';
import { authCookieOptions, authJson, trustedAuthOrigin, validateAuthMutation } from './auth-csrf';

export const ACCOUNT_COOKIE = 'account_session';
export const ACCOUNT_EXPIRY_COOKIE = 'account_session_expires';
export const BINDING_COOKIE = 'auth_browser_binding';
export const PENDING_INVITATION_COOKIE = 'auth_invitation';
const OPAQUE = /^[A-Za-z0-9_-]{43}$/;
const PHONE = /^\+[1-9]\d{7,14}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DAY = 86400;
const MAX_BODY_BYTES = 16_384;
const ROLES = ['ADMIN', 'MANAGER', 'TEACHER', 'STUDENT'];
type JsonObject = Record<string, unknown>;
type Rule = (value: unknown) => boolean;
type Action = { auth?: 'account' | 'tenant'; fields: Record<string, Rule>; binding?: 'new' | 'existing' };
const text = (min: number, max: number): Rule => value => typeof value === 'string' && value.length >= min && value.length <= max;
const matches = (pattern: RegExp): Rule => value => typeof value === 'string' && pattern.test(value);
const email: Rule = value => typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const actions: Record<string, Action> = {
  register: { fields: { email, full_name: text(2, 100), password: text(12, 128) }, binding: 'new' },
  'verify-email': { fields: { token: matches(OPAQUE) }, binding: 'existing' },
  login: { fields: { email, password: text(1, 128) } },
  'forgot-password': { fields: { email } },
  'reset-password': { fields: { token: matches(OPAQUE), password: text(12, 128) } },
  'google/start': { fields: {}, binding: 'new' },
  'google/link': { fields: {}, binding: 'new', auth: 'account' },
  logout: { fields: {}, auth: 'account' },
  centers: { fields: { name: text(2, 100), phone: matches(PHONE) }, auth: 'account' },
  'link-legacy': { fields: { phone: matches(PHONE), password: text(1, 128) }, auth: 'account' },
  'select-organization': { fields: { organization_id: matches(UUID) }, auth: 'account' },
  invitations: { fields: { email, role: value => typeof value === 'string' && ['TEACHER', 'MANAGER', 'STUDENT'].includes(value) }, auth: 'tenant' },
  'accept-invitation': { fields: { token: matches(OPAQUE), phone: matches(PHONE) }, auth: 'account' },
  'pending-invitation': { fields: { token: matches(OPAQUE) } },
};

function object(value: unknown): JsonObject | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : null;
}

function error(code: string, message: string, status: number): NextResponse {
  return authJson({ code, message }, status);
}

function invalidInput(): NextResponse {
  return error('INVALID_INPUT', 'Please check the supplied information.', 400);
}

function invalidBackend(): NextResponse {
  return error('UPSTREAM_UNAVAILABLE', 'Authentication service returned an unexpected response.', 502);
}

function backendError(status: number): NextResponse {
  const errors: Record<number, [string, string]> = {
    400: ['INVALID_INPUT', 'The information or link is invalid or expired.'],
    401: ['UNAUTHENTICATED', 'Please sign in again or check your credentials.'],
    403: ['FORBIDDEN', 'This account does not have access to this action.'],
    404: ['ACCOUNT_AUTH_DISABLED', 'Email and Google sign-in are not enabled yet.'],
    409: ['IDENTITY_CONFLICT', 'This identity or phone is already in use. Sign in to the existing account to link it.'],
    429: ['RATE_LIMITED', 'Too many attempts. Please wait before trying again.'],
    503: ['PROVIDER_UNAVAILABLE', 'This sign-in provider is not configured yet.'],
  };
  const known = errors[status];
  return known ? error(known[0], known[1], status)
    : error('UPSTREAM_UNAVAILABLE', 'Authentication service is temporarily unavailable.', 502);
}

type BackendResult = { ok: true; data: JsonObject } | { ok: false; response: NextResponse };

async function backend(path: string, method: 'GET' | 'POST', body?: JsonObject, bearer?: string): Promise<BackendResult> {
  const secret = process.env.AUTH_BFF_SECRET;
  if (!secret || secret.length < 32) return { ok: false, response: backendError(503) };
  try {
    const headers: Record<string, string> = { Accept: 'application/json', 'X-Auth-BFF-Secret': secret };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (bearer) headers.Authorization = `Bearer ${bearer}`;
    const response = await fetch(`${BACKEND_URL}/api/auth/accounts/${path}`, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      const denied = backendError(response.status);
      const retry = response.headers.get('retry-after');
      if (response.status === 429 && retry && /^\d{1,6}$/.test(retry)) denied.headers.set('Retry-After', retry);
      return { ok: false, response: denied };
    }
    const data = object(await response.json());
    return data ? { ok: true, data } : { ok: false, response: invalidBackend() };
  } catch (cause) {
    const timeout = cause instanceof Error && ['TimeoutError', 'AbortError'].includes(cause.name);
    return { ok: false, response: error('UPSTREAM_UNAVAILABLE', 'Authentication service is temporarily unavailable.', timeout ? 504 : 502) };
  }
}

function clearCookie(response: NextResponse, name: string) {
  response.cookies.set(name, '', { ...authCookieOptions(), maxAge: 0 });
}

export function clearTenantCookies(response: NextResponse): void {
  clearCookie(response, TOKEN_CONFIG.access.cookieName);
  clearCookie(response, TOKEN_CONFIG.refresh.cookieName);
}

export function clearAccountCookies(response: NextResponse): void {
  for (const name of [ACCOUNT_COOKIE, ACCOUNT_EXPIRY_COOKIE, BINDING_COOKIE, PENDING_INVITATION_COOKIE]) clearCookie(response, name);
  clearTenantCookies(response);
}

function expirySignature(token: string, timestamp: string): string {
  return createHmac('sha256', process.env.AUTH_BFF_SECRET ?? '').update(`${token}.${timestamp}`).digest('base64url');
}

/** Signed metadata bounds child cookies without exposing or trusting client-supplied expiry. */
export function accountSessionRemaining(request: NextRequest): number | null {
  const token = request.cookies.get(ACCOUNT_COOKIE)?.value ?? '';
  const metadata = request.cookies.get(ACCOUNT_EXPIRY_COOKIE)?.value ?? '';
  const [timestamp, signature, extra] = metadata.split('.');
  if (!process.env.AUTH_BFF_SECRET || !OPAQUE.test(token) || !/^\d{13}$/.test(timestamp ?? '')
    || !OPAQUE.test(signature ?? '') || extra !== undefined) return null;
  const expected = expirySignature(token, timestamp);
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
  return Math.max(0, Math.min(30 * DAY, Math.floor((Number(timestamp) - Date.now()) / 1000)));
}

export const getAccountSessionRemaining = accountSessionRemaining;

export function tenantTokenMaxAge(token: string, maximum: number, parentRemaining?: number | null): number | null {
  if (token.length > 8192 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return null;
  try {
    const payload = object(JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')));
    if (!payload || typeof payload.exp !== 'number' || !Number.isSafeInteger(payload.exp)) return null;
    const remaining = payload.exp - Math.ceil(Date.now() / 1000);
    return remaining > 0 ? Math.min(maximum, remaining, parentRemaining ?? maximum) : null;
  } catch {
    return null;
  }
}

export function setTenantAuthCookies(response: NextResponse, access: string, refresh: string, parentRemaining?: number | null): boolean {
  const accessAge = tenantTokenMaxAge(access, 15 * 60, parentRemaining);
  const refreshAge = tenantTokenMaxAge(refresh, 7 * DAY, parentRemaining);
  if (accessAge === null || refreshAge === null || accessAge <= 0 || refreshAge <= 0) return false;
  response.cookies.set(TOKEN_CONFIG.access.cookieName, access, { ...authCookieOptions(), maxAge: accessAge });
  response.cookies.set(TOKEN_CONFIG.refresh.cookieName, refresh, { ...authCookieOptions(), maxAge: refreshAge });
  return true;
}

function accountView(value: unknown): JsonObject | null {
  const account = object(value);
  if (!account || typeof account.id !== 'string' || typeof account.email !== 'string'
    || typeof account.full_name !== 'string' || typeof account.email_verified !== 'boolean') return null;
  return { id: account.id, email: account.email, full_name: account.full_name, email_verified: account.email_verified };
}

function userView(value: unknown): JsonObject | null {
  const user = object(value);
  if (!user || typeof user.id !== 'string' || typeof user.full_name !== 'string'
    || typeof user.role !== 'string' || !ROLES.includes(user.role)
    || typeof user.organization_id !== 'string') return null;
  const safe: JsonObject = { id: user.id, full_name: user.full_name, role: user.role, organization_id: user.organization_id, is_active: true };
  for (const key of ['email', 'phone', 'organization_name', 'organization_logo_url', 'created_at', 'updated_at']) {
    if (typeof user[key] === 'string' || user[key] === null) safe[key] = user[key];
  }
  return safe;
}

function accountSessionLifetime(data: JsonObject): { expires: number; maxAge: number } | null {
  if (typeof data.accountSessionToken !== 'string' || !OPAQUE.test(data.accountSessionToken)
    || typeof data.expiresAt !== 'string') return null;
  const expires = Math.min(Date.parse(data.expiresAt), Date.now() + 30 * DAY * 1000);
  const maxAge = Math.floor((expires - Date.now()) / 1000);
  return Number.isFinite(expires) && maxAge > 0 ? { expires, maxAge } : null;
}

function installAccountSession(response: NextResponse, data: JsonObject): boolean {
  const lifetime = accountSessionLifetime(data);
  if (!lifetime) return false;
  const { expires, maxAge } = lifetime;
  const token = data.accountSessionToken as string;
  response.cookies.set(ACCOUNT_COOKIE, token, { ...authCookieOptions(), maxAge });
  const timestamp = String(Math.floor(expires));
  response.cookies.set(ACCOUNT_EXPIRY_COOKIE, `${timestamp}.${expirySignature(token, timestamp)}`, { ...authCookieOptions(), maxAge });
  clearTenantCookies(response);
  return true;
}

function googleUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'accounts.google.com' && !url.username && !url.password && !url.port ? url.href : null;
  } catch { return null; }
}

async function readBody(request: NextRequest): Promise<JsonObject | null> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return null;
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  try {
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_BODY_BYTES) { await reader.cancel(); return null; }
      chunks.push(chunk.value);
    }
    return object(JSON.parse(Buffer.concat(chunks).toString('utf8')));
  } catch { return null; }
  finally { reader.releaseLock(); }
}

export async function revokeAccountSession(request: NextRequest): Promise<void> {
  const token = request.cookies.get(ACCOUNT_COOKIE)?.value ?? '';
  if (OPAQUE.test(token)) await backend('logout', 'POST', {}, token);
}

export async function handleAccountRequest(request: NextRequest, segments: string[]): Promise<NextResponse> {
  const path = segments.join('/');
  if (request.method === 'GET') {
    if (path === 'pending-invitation') return authJson({ pending: OPAQUE.test(request.cookies.get(PENDING_INVITATION_COOKIE)?.value ?? '') });
    if (path !== 'me') return error('NOT_FOUND', 'Unknown authentication action.', 404);
    const bearer = request.cookies.get(ACCOUNT_COOKIE)?.value ?? '';
    if (!OPAQUE.test(bearer)) return backendError(401);
    const result = await backend('me', 'GET', undefined, bearer);
    if (!result.ok) return result.response;
    const account = accountView(result.data.account);
    if (!account || !Array.isArray(result.data.memberships) || typeof result.data.onboardingRequired !== 'boolean') return invalidBackend();
    const memberships = [];
    for (const item of result.data.memberships) {
      const membership = object(item);
      const organization = object(membership?.organization);
      if (!membership || typeof membership.organization_id !== 'string' || typeof membership.role !== 'string'
        || !ROLES.includes(membership.role) || !organization || typeof organization.name !== 'string' || typeof organization.status !== 'string') return invalidBackend();
      memberships.push({ organization_id: membership.organization_id, role: membership.role, organization: { name: organization.name, status: organization.status } });
    }
    return authJson({ account, memberships, onboardingRequired: result.data.onboardingRequired });
  }
  if (request.method !== 'POST' || !Object.hasOwn(actions, path)) return error('NOT_FOUND', 'Unknown authentication action.', 404);
  const csrfError = validateAuthMutation(request);
  if (csrfError) return csrfError;
  const action = actions[path];
  const body = await readBody(request);
  if (!body) return invalidInput();
  if (path === 'accept-invitation' && body.token === undefined) body.token = request.cookies.get(PENDING_INVITATION_COOKIE)?.value;
  if (Object.keys(body).some(key => !Object.hasOwn(action.fields, key))
    || Object.entries(action.fields).some(([key, validate]) => !validate(body[key]))) return invalidInput();

  if (path === 'pending-invitation') {
    const response = authJson({ pending: true });
    response.cookies.set(PENDING_INVITATION_COOKIE, body.token as string, { ...authCookieOptions(), maxAge: 7 * DAY });
    return response;
  }

  let bearer: string | undefined;
  if (action.auth) {
    bearer = request.cookies.get(action.auth === 'account' ? ACCOUNT_COOKIE : TOKEN_CONFIG.access.cookieName)?.value;
    const valid = action.auth === 'account' ? OPAQUE.test(bearer ?? '') : bearer && tenantTokenMaxAge(bearer, 15 * 60) !== null;
    if (!valid) {
      if (path === 'logout') { const response = authJson({ success: true }); clearAccountCookies(response); return response; }
      return backendError(401);
    }
  }
  let binding: string | undefined;
  if (action.binding === 'new') binding = randomBytes(32).toString('base64url');
  if (action.binding === 'existing') {
    binding = request.cookies.get(BINDING_COOKIE)?.value;
    if (!binding || !OPAQUE.test(binding)) return error('BINDING_REQUIRED', 'Open the verification link in the browser used to register, or register again here.', 400);
  }
  if (binding) body.browser_binding = binding;
  const parentRemaining = path === 'select-organization' ? accountSessionRemaining(request) : null;
  if (path === 'select-organization' && (parentRemaining === null || parentRemaining <= 0)) return backendError(401);
  const result = await backend(path, 'POST', body, bearer);
  if (path === 'logout') {
    const response = result.ok ? authJson({ success: true }) : result.response;
    clearAccountCookies(response);
    return response;
  }
  if (!result.ok) {
    // Registration may have sent mail before a transport failure. Preserve its
    // binding so that the verification link can still be used in this browser.
    if (action.binding === 'new' && binding) result.response.cookies.set(BINDING_COOKIE, binding, { ...authCookieOptions(), maxAge: 1800 });
    return result.response;
  }
  const data = result.data;
  let response: NextResponse;
  switch (path) {
    case 'register': case 'forgot-password':
      response = authJson({ message: 'If eligible, check your email for the next step.' });
      break;
    case 'login': {
      const account = accountView(data.account);
      if (!account || !accountSessionLifetime(data)) return invalidBackend();
      response = authJson({ account });
      if (request.cookies.get(ACCOUNT_COOKIE)?.value !== data.accountSessionToken) await revokeAccountSession(request);
      if (!installAccountSession(response, data)) return invalidBackend();
      break;
    }
    case 'google/start': case 'google/link': {
      const authorizationUrl = googleUrl(data.authorizationUrl);
      if (!authorizationUrl) return invalidBackend();
      response = authJson({ authorizationUrl });
      break;
    }
    case 'verify-email':
      if (data.verified !== true) return invalidBackend();
      response = authJson({ verified: true });
      clearCookie(response, BINDING_COOKIE);
      break;
    case 'reset-password':
      if (data.success !== true) return invalidBackend();
      response = authJson({ success: true });
      clearAccountCookies(response);
      break;
    case 'select-organization': {
      const user = userView(data.user);
      if (!user || typeof data.accessToken !== 'string' || typeof data.refreshToken !== 'string') return invalidBackend();
      response = authJson({ user });
      if (!setTenantAuthCookies(response, data.accessToken, data.refreshToken, parentRemaining)) return invalidBackend();
      break;
    }
    case 'centers': case 'accept-invitation':
      if (typeof data.organization_id !== 'string') return invalidBackend();
      response = authJson({ organization_id: data.organization_id });
      if (path === 'accept-invitation') clearCookie(response, PENDING_INVITATION_COOKIE);
      break;
    case 'link-legacy':
      if (data.linked !== true) return invalidBackend();
      response = authJson({ linked: true });
      break;
    case 'invitations':
      if (typeof data.invitation_id !== 'string' || typeof data.expires_at !== 'string') return invalidBackend();
      response = authJson({ invitation_id: data.invitation_id, expires_at: data.expires_at });
      break;
    default: return invalidBackend();
  }
  if (action.binding === 'new' && binding) response.cookies.set(BINDING_COOKIE, binding, { ...authCookieOptions(), maxAge: 1800 });
  return response;
}

/** Google is the sole cross-site GET callback; backend validates state + binding + PKCE. */
export async function handleGoogleCallback(request: NextRequest): Promise<NextResponse> {
  const origin = trustedAuthOrigin(request);
  if (!origin) return backendError(503);
  const redirect = (path: string) => {
    const response = NextResponse.redirect(new URL(path, origin), 303);
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  };
  const failure = (code: string) => redirect(`/login?auth_error=${code}`);
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const binding = request.cookies.get(BINDING_COOKIE)?.value ?? '';
  if (!code || code.length > 4096 || !state || !OPAQUE.test(state) || !OPAQUE.test(binding)) return failure('invalid_callback');
  if (request.nextUrl.searchParams.getAll('code').length !== 1 || request.nextUrl.searchParams.getAll('state').length !== 1) return failure('invalid_callback');
  const result = await backend('google/callback', 'POST', { code, state, browser_binding: binding });
  if (!result.ok) {
    const safeCode: Record<number, string> = { 400: 'invalid_callback', 401: 'sign_in_required', 403: 'forbidden', 404: 'disabled', 409: 'identity_conflict', 429: 'rate_limited', 503: 'provider_unavailable' };
    return failure(safeCode[result.response.status] ?? 'unavailable');
  }
  const pending = OPAQUE.test(request.cookies.get(PENDING_INVITATION_COOKIE)?.value ?? '');
  const response = redirect(pending ? '/accept-invitation' : result.data.linked === true ? '/onboarding?google_linked=1' : '/onboarding');
  if (result.data.linked !== true) {
    if (!accountView(result.data.account) || !accountSessionLifetime(result.data)) return failure('unavailable');
    if (request.cookies.get(ACCOUNT_COOKIE)?.value !== result.data.accountSessionToken) await revokeAccountSession(request);
    if (!installAccountSession(response, result.data)) return failure('unavailable');
  }
  clearCookie(response, BINDING_COOKIE);
  return response;
}
