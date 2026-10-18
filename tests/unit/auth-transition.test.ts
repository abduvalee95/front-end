import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fixtures = vi.hoisted(() => ({ authRequest: vi.fn(), store: { isAuthenticated: true } }));
vi.mock('@/lib/auth/account-client', () => ({ authRequest: fixtures.authRequest }));
vi.mock('@/store/auth.store', () => ({ useAuthStore: { getState: () => fixtures.store } }));
vi.mock('@/lib/logger', () => ({ logger: { debug: vi.fn(), warn: vi.fn() } }));

let refresh: typeof import('@/lib/auth/tenant-refresh');
let manager: typeof import('@/lib/auth/silent-refresh').silentRefreshManager;

function deferred() {
  let resolve!: (value: unknown) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  fixtures.authRequest.mockReset();
  fixtures.store.isAuthenticated = true;
  refresh = await import('@/lib/auth/tenant-refresh');
  ({ silentRefreshManager: manager } = await import('@/lib/auth/silent-refresh'));
});

afterEach(() => { manager.stop(); vi.useRealTimers(); });

describe('credential transitions and rotating tenant cookies', () => {
  it('drains an existing old-cookie response before a new credential write and blocks additional refreshes', async () => {
    const oldResponse = deferred();
    const writes: string[] = [];
    fixtures.authRequest.mockImplementationOnce(() => oldResponse.promise.then(() => { writes.push('old tenant cookies'); }));
    const inFlight = refresh.refreshTenantSession();
    refresh.pauseTenantRefresh();
    const nextCredentialWrite = refresh.waitForPendingTenantRefresh().then(() => { writes.push('new tenant cookies'); });
    await Promise.resolve();
    expect(writes).toEqual([]);
    await expect(refresh.refreshTenantSession()).rejects.toThrow('AUTH_TRANSITION');
    expect(fixtures.authRequest).toHaveBeenCalledTimes(1);

    oldResponse.resolve({ success: true });
    await Promise.all([inFlight, nextCredentialWrite]);
    expect(writes).toEqual(['old tenant cookies', 'new tenant cookies']);
    expect(refresh.isTenantRefreshPaused()).toBe(true);

    refresh.resumeTenantRefresh();
    fixtures.authRequest.mockResolvedValueOnce({ success: true });
    await expect(refresh.refreshTenantSession()).resolves.toBeUndefined();
    expect(fixtures.authRequest).toHaveBeenCalledTimes(2);
  });

  it('does not start a refresh while draining and allows a transition after an old refresh failed', async () => {
    await expect(refresh.waitForPendingTenantRefresh()).resolves.toBeUndefined();
    expect(fixtures.authRequest).not.toHaveBeenCalled();
    const oldResponse = deferred();
    fixtures.authRequest.mockReturnValueOnce(oldResponse.promise);
    const oldRequest = refresh.refreshTenantSession();
    const handledFailure = oldRequest.catch(() => undefined);
    refresh.pauseTenantRefresh();
    const drain = refresh.waitForPendingTenantRefresh();
    oldResponse.reject(new Error('old session revoked'));
    await expect(drain).resolves.toBeUndefined();
    await handledFailure;
    expect(fixtures.authRequest).toHaveBeenCalledTimes(1);
  });

  it('does not rearm a stopped proactive timer when its already-running refresh succeeds', async () => {
    const oldResponse = deferred();
    fixtures.authRequest.mockReturnValueOnce(oldResponse.promise);
    manager.start();
    expect(fixtures.authRequest).toHaveBeenCalledTimes(1);
    // This is the interval between leaving a dashboard and selecting another center.
    manager.stop();
    oldResponse.resolve({ success: true });
    await refresh.waitForPendingTenantRefresh();
    await Promise.resolve();
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(15 * 60_000);
    expect(fixtures.authRequest).toHaveBeenCalledTimes(1);
  });

  it('does not rearm a stopped visibility refresh after its response arrives', async () => {
    const oldResponse = deferred();
    fixtures.authRequest.mockReturnValueOnce(oldResponse.promise);
    const wakeup = manager.refreshNow();
    manager.stop();
    oldResponse.resolve({ success: true });
    await expect(wakeup).resolves.toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('never starts tenant refresh timers or requests during the account stage', async () => {
    refresh.pauseTenantRefresh();
    manager.start();
    await expect(manager.refreshNow()).resolves.toBe(false);
    expect(fixtures.authRequest).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);

    refresh.resumeTenantRefresh();
    fixtures.store.isAuthenticated = false;
    manager.start();
    await expect(manager.refreshNow()).resolves.toBe(false);
    expect(fixtures.authRequest).not.toHaveBeenCalled();

    fixtures.store.isAuthenticated = true;
    manager.start(Date.now());
    expect(vi.getTimerCount()).toBe(1);
    refresh.pauseTenantRefresh();
    await vi.advanceTimersByTimeAsync(13 * 60_000);
    expect(fixtures.authRequest).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('continues proactive scheduling for a successful current tenant session', async () => {
    fixtures.authRequest.mockResolvedValueOnce({ success: true });
    manager.start();
    await refresh.waitForPendingTenantRefresh();
    await Promise.resolve();
    expect(fixtures.authRequest).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(1);
  });
});
