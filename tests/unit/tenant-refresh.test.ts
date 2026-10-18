import { beforeEach, describe, expect, it, vi } from 'vitest';

const authRequest = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/account-client', () => ({ authRequest }));

let refreshTenantSession: typeof import('@/lib/auth/tenant-refresh').refreshTenantSession;

beforeEach(async () => {
  vi.resetModules();
  authRequest.mockReset();
  ({ refreshTenantSession } = await import('@/lib/auth/tenant-refresh'));
});

function deferred() {
  let resolve!: (value: unknown) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

describe('shared tenant refresh rotation', () => {
  it('shares one refresh request across concurrent callers and starts a new one after completion', async () => {
    const firstReply = deferred();
    authRequest.mockReturnValueOnce(firstReply.promise).mockResolvedValueOnce({ success: true });

    const proactive = refreshTenantSession();
    const axiosRetry = refreshTenantSession();
    const tabWakeup = refreshTenantSession();
    expect(proactive).toBe(axiosRetry);
    expect(proactive).toBe(tabWakeup);
    expect(authRequest).toHaveBeenCalledTimes(1);
    expect(authRequest).toHaveBeenCalledWith('/api/auth/refresh', { method: 'POST', body: '{}' });

    firstReply.resolve({ success: true });
    await expect(Promise.all([proactive, axiosRetry, tabWakeup])).resolves.toEqual([undefined, undefined, undefined]);
    const subsequent = refreshTenantSession();
    expect(subsequent).not.toBe(proactive);
    await expect(subsequent).resolves.toBeUndefined();
    expect(authRequest).toHaveBeenCalledTimes(2);
  });

  it('delivers one failure to all callers and permits a subsequent retry', async () => {
    const firstReply = deferred();
    const failure = new Error('temporary upstream outage');
    authRequest.mockReturnValueOnce(firstReply.promise).mockResolvedValueOnce({ success: true });

    const proactive = refreshTenantSession();
    const axiosRetry = refreshTenantSession();
    const results = Promise.allSettled([proactive, axiosRetry]);
    firstReply.reject(failure);
    expect(await results).toEqual([
      { status: 'rejected', reason: failure },
      { status: 'rejected', reason: failure },
    ]);
    expect(authRequest).toHaveBeenCalledTimes(1);

    await expect(refreshTenantSession()).resolves.toBeUndefined();
    expect(authRequest).toHaveBeenCalledTimes(2);
  });
});
