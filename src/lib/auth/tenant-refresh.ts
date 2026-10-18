import { authRequest } from './account-client';

// Refresh token rotation is single-use: proactive refresh and Axios 401 retries
// must share the same in-flight request, including visibility/tab wakeups.
let pending: Promise<void> | null = null;
let paused = false;

/** Credential transitions must finish after any response that can write old cookies. */
export function pauseTenantRefresh(): void { paused = true; }
export function resumeTenantRefresh(): void { paused = false; }
export function isTenantRefreshPaused(): boolean { return paused; }
export async function waitForPendingTenantRefresh(): Promise<void> {
  await pending?.catch(() => undefined);
}

export function refreshTenantSession(): Promise<void> {
  if (paused) return Promise.reject(new Error('AUTH_TRANSITION'));
  if (!pending) {
    pending = authRequest('/api/auth/refresh', { method: 'POST', body: '{}' })
      .then(() => undefined).finally(() => { pending = null; });
  }
  return pending;
}
