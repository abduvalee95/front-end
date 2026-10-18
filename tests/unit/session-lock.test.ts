import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { withSessionLock } from '@/lib/auth/session-lock';
import { authRequest, resetAuthCsrf } from '@/lib/auth/account-client';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(yes => { resolve = yes; });
  return { promise, resolve };
}

function installLocks() {
  let queue = Promise.resolve<unknown>(undefined);
  const request = vi.fn((_name: string, _options: unknown, callback: () => Promise<unknown>) => {
    const result = queue.then(callback);
    queue = result.catch(() => undefined);
    return result;
  });
  vi.stubGlobal('navigator', { locks: { request } });
  return request;
}

beforeEach(() => { resetAuthCsrf(); });
afterEach(() => { vi.unstubAllGlobals(); });

describe('origin-wide credential writes', () => {
  it('supports browsers without Web Locks and server-side calls', async () => {
    const operation = vi.fn().mockResolvedValue('result');
    vi.stubGlobal('navigator', undefined);
    await expect(withSessionLock(operation)).resolves.toBe('result');
    vi.stubGlobal('navigator', {});
    await expect(withSessionLock(operation)).resolves.toBe('result');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('queues refresh and login before fetch reads shared credentials, while GET remains available', async () => {
    const request = installLocks();
    const releaseRefresh = deferred();
    const refreshStarted = deferred();
    const writes: string[] = [];
    const fetchMock = vi.fn(async (path: string) => {
      if (path === '/api/auth/csrf') return Response.json({ csrfToken: 'c'.repeat(43) });
      if (path === '/api/auth/refresh') {
        writes.push('refresh started'); refreshStarted.resolve();
        await releaseRefresh.promise;
        writes.push('refresh completed');
      } else writes.push(path);
      return Response.json({ success: true });
    });
    vi.stubGlobal('fetch', fetchMock);

    const refresh = authRequest('/api/auth/refresh', { method: 'POST', body: '{}' });
    await refreshStarted.promise;
    const login = authRequest('/api/auth/accounts/login', { method: 'POST', body: '{}' });
    await authRequest('/api/auth/accounts/me');
    expect(writes).toEqual(['refresh started', '/api/auth/accounts/me']);
    releaseRefresh.resolve();
    await Promise.all([refresh, login]);
    expect(writes).toEqual(['refresh started', '/api/auth/accounts/me', 'refresh completed', '/api/auth/accounts/login']);
    expect(request.mock.calls.map(call => call.slice(0, 2))).toEqual([
      ['bilim-nuru-auth-session', { mode: 'exclusive' }],
      ['bilim-nuru-auth-session', { mode: 'exclusive' }],
    ]);
  });

  it('holds one lock across a safe CSRF retry and releases it after a failed mutation', async () => {
    const request = installLocks();
    let attempts = 0;
    vi.stubGlobal('fetch', vi.fn(async (path: string) => {
      if (path === '/api/auth/csrf') return Response.json({ csrfToken: 'c'.repeat(43) });
      attempts++;
      if (attempts === 1) return Response.json({ code: 'CSRF_INVALID' }, { status: 403 });
      if (attempts === 2) return Response.json({ code: 'UNAUTHENTICATED' }, { status: 401 });
      return Response.json({ success: true });
    }));

    await expect(authRequest('/api/auth/refresh', { method: 'POST', body: '{}' })).rejects.toMatchObject({ status: 401 });
    expect(request).toHaveBeenCalledTimes(1);
    await expect(authRequest('/api/auth/logout', { method: 'POST', body: '{}' })).resolves.toEqual({ success: true });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('never executes a credential mutation if the browser refuses the lock', async () => {
    const failure = new Error('Lock unavailable');
    vi.stubGlobal('navigator', { locks: { request: vi.fn().mockRejectedValue(failure) } });
    const operation = vi.fn();
    await expect(withSessionLock(operation)).rejects.toBe(failure);
    expect(operation).not.toHaveBeenCalled();
  });
});
