import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ token: undefined as string | undefined, verify: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => mocks.token ? { value: mocks.token } : undefined }) }));
vi.mock('@/lib/auth/verify-token', () => ({ verifyAccessToken: mocks.verify }));

import { getServerSession, rateLimitKey } from '@/lib/auth/server-session';

const claims = { sub: 'user-1', role: 'ADMIN' as const, organization_id: 'organization-1' };
const liveClaims = { ...claims, session_id: 'tenant-session-1' };
const currentUser = { id: claims.sub, role: claims.role, organization_id: claims.organization_id };
const fetchMock = vi.fn<typeof fetch>();
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });

describe('server route session authorization', () => {
  beforeEach(() => {
    mocks.token = 'signed-token'; mocks.verify.mockReset(); fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('preserves signature-only legacy phone sessions without backend dependency', async () => {
    mocks.verify.mockResolvedValue({ status: 'valid', claims });
    expect(await getServerSession()).toEqual({ token: mocks.token, claims });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects missing, forged and expired credentials before any live check', async () => {
    mocks.token = undefined;
    expect(await getServerSession()).toBeNull();
    expect(mocks.verify).not.toHaveBeenCalled();
    mocks.token = 'signed-token';
    for (const result of [{ status: 'invalid' }, { status: 'expired', claims: liveClaims }]) {
      mocks.verify.mockResolvedValueOnce(result);
      expect(await getServerSession()).toBeNull();
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([currentUser, { user: currentUser }])('requires backend live validation for account sessions: %j', async body => {
    mocks.verify.mockResolvedValue({ status: 'valid', claims: liveClaims });
    fetchMock.mockResolvedValueOnce(reply(body));
    expect(await getServerSession()).toEqual({ token: mocks.token, claims: liveClaims });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/api\/auth\/me$/), expect.objectContaining({
      headers: { Authorization: `Bearer ${mocks.token}`, Accept: 'application/json' }, cache: 'no-store', redirect: 'error', signal: expect.any(AbortSignal),
    }));
  });

  it.each([401, 403, 404, 429, 500, 503])('denies a session rejected or unavailable upstream (%i)', async status => {
    mocks.verify.mockResolvedValue({ status: 'valid', claims: liveClaims });
    fetchMock.mockResolvedValueOnce(reply({}, status));
    expect(await getServerSession()).toBeNull();
  });

  it.each([
    null, [], {}, { user: null }, { ...currentUser, id: 'another-user' },
    { ...currentUser, role: 'TEACHER' }, { ...currentUser, organization_id: 'another-organization' },
  ])('rejects malformed or mismatched live identity: %j', async data => {
    mocks.verify.mockResolvedValue({ status: 'valid', claims: liveClaims });
    fetchMock.mockResolvedValueOnce(reply(data));
    expect(await getServerSession()).toBeNull();
  });

  it('fails closed on a transport/timeout failure without throwing', async () => {
    mocks.verify.mockResolvedValue({ status: 'valid', claims: liveClaims });
    fetchMock.mockRejectedValueOnce(new DOMException('timed out', 'TimeoutError'));
    expect(await getServerSession()).toBeNull();
  });

  it('requires account JWT subject, role and organization before checking it', async () => {
    for (const overrides of [{ sub: null }, { role: null }, { organization_id: null }]) {
      mocks.verify.mockResolvedValueOnce({ status: 'valid', claims: { ...liveClaims, ...overrides } });
      expect(await getServerSession()).toBeNull();
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('retains stable rate-limit identity across live session checks', () => {
    expect(rateLimitKey({ token: 'token', claims: liveClaims })).toBe('user:user-1');
  });
});
