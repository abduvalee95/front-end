// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import type { User } from '@/types/auth';

const mocks = vi.hoisted(() => ({
  get: vi.fn(), replace: vi.fn(), start: vi.fn(), stop: vi.fn(),
  setLoading: vi.fn(), setAuth: vi.fn(), clearAuth: vi.fn(),
  toastSuccess: vi.fn(), toastError: vi.fn(), loggerWarn: vi.fn(), loggerError: vi.fn(),
  paused: false, resume: vi.fn(),
  store: {
    user: null as User | null, isAuthenticated: true, isHydrated: true,
    setLoading: (_loading: boolean) => {}, setAuth: (_user: User) => {}, clearAuth: () => {},
  },
}));

vi.mock('@/lib/api/client', () => ({ api: { get: mocks.get } }));
vi.mock('@/store/auth.store', () => ({
  useAuthStore: Object.assign(() => mocks.store, { getState: () => mocks.store }),
}));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('@/lib/auth/silent-refresh', () => ({ silentRefreshManager: { start: mocks.start, stop: mocks.stop } }));
vi.mock('@/lib/auth/tenant-refresh', () => ({
  isTenantRefreshPaused: () => mocks.paused,
  resumeTenantRefresh: mocks.resume,
}));
vi.mock('sonner', () => ({ toast: { success: mocks.toastSuccess, error: mocks.toastError } }));
vi.mock('@/lib/logger', () => ({ logger: { warn: mocks.loggerWarn, error: mocks.loggerError } }));
vi.mock('@/lib/i18n/toast', () => ({ tt: (key: string) => key }));
vi.mock('@/i18n', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('@/components/ui/button', () => ({ Button: ({ children, ...props }: React.ComponentProps<'button'>) => <button {...props}>{children}</button> }));

import { restoreSession } from '@/lib/auth/session';
import { SessionProvider } from '@/components/auth/SessionProvider';

const router = { replace: mocks.replace };
const staleUser: User = {
  id: 'stale-admin', email: 'previous@example.test', full_name: 'Persisted Admin', role: 'ADMIN',
  organization_id: 'old-center', is_active: true, can_switch_center: true,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
};
const verifiedUser: User = {
  ...staleUser, id: 'current-teacher', email: 'current@example.test', full_name: 'Current Teacher',
  organization_id: 'current-center', role: 'TEACHER', can_switch_center: undefined,
};

function authError(status: number) {
  return new AxiosError('Backend rejected the session', 'ERR_BAD_RESPONSE', undefined, undefined, {
    status, statusText: 'Rejected', data: {}, headers: {}, config: { headers: new AxiosHeaders() },
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockReset();
  mocks.store.user = { ...staleUser };
  mocks.store.isAuthenticated = true;
  mocks.store.isHydrated = true;
  mocks.paused = false;
  mocks.resume.mockImplementation(() => { mocks.paused = false; });
  mocks.store.setLoading = mocks.setLoading;
  mocks.store.setAuth = mocks.setAuth.mockImplementation((user: User) => {
    mocks.store.user = user;
    mocks.store.isAuthenticated = true;
  });
  mocks.store.clearAuth = mocks.clearAuth.mockImplementation(() => {
    mocks.store.user = null;
    mocks.store.isAuthenticated = false;
  });
});

afterEach(cleanup);

describe('session restoration verifies persisted profiles', () => {
  it('always fetches the server session and replaces the previously persisted user', async () => {
    mocks.get.mockResolvedValueOnce({ data: { user: verifiedUser } });
    const result = await restoreSession();

    expect(mocks.get).toHaveBeenCalledWith('/auth/me', { signal: undefined });
    expect(mocks.get).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true, user: { ...verifiedUser, can_switch_center: false } });
    expect(mocks.store.user).toEqual({ ...verifiedUser, can_switch_center: false });
    expect(mocks.store.user?.organization_id).not.toBe(staleUser.organization_id);
    expect(mocks.setLoading.mock.calls).toEqual([[true], [false]]);
    expect(mocks.clearAuth).not.toHaveBeenCalled();
  });

  it('sets the center-switch navigation hint only from the current server response', async () => {
    mocks.get.mockResolvedValueOnce({ data: { user: verifiedUser, canSelectOrganization: true } });
    const result = await restoreSession();
    expect(result.user?.can_switch_center).toBe(true);
    expect(mocks.setAuth).toHaveBeenCalledWith({ ...verifiedUser, can_switch_center: true });
  });

  it.each([401, 404])('clears persisted auth when the server says the session is absent (%i)', async status => {
    mocks.get.mockRejectedValueOnce(authError(status));
    const result = await restoreSession();
    expect(result).toEqual({ success: false, error: 'Not authenticated' });
    expect(mocks.clearAuth).toHaveBeenCalledTimes(1);
    expect(mocks.setAuth).not.toHaveBeenCalled();
    expect(mocks.store.isAuthenticated).toBe(false);
    expect(mocks.setLoading.mock.calls).toEqual([[true], [false]]);
  });

  it.each([new TypeError('Network unavailable'), authError(503)])('makes transient failures retryable without logging out', async error => {
    mocks.get.mockRejectedValueOnce(error);
    const result = await restoreSession();
    expect(result).toEqual({ success: false, error: 'Failed to restore session', retryable: true });
    expect(mocks.clearAuth).not.toHaveBeenCalled();
    expect(mocks.setAuth).not.toHaveBeenCalled();
    expect(mocks.store.user).toEqual(staleUser);
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.toastError).not.toHaveBeenCalled();
    expect(mocks.setLoading.mock.calls).toEqual([[true], [false]]);
  });

  it('does not reinstall an old profile when its request was aborted during an account transition', async () => {
    const reply = deferred<{ data: { user: User } }>();
    const controller = new AbortController();
    mocks.get.mockReturnValueOnce(reply.promise);
    const pending = restoreSession(controller.signal);
    controller.abort();
    mocks.store.user = null;
    mocks.store.isAuthenticated = false;
    reply.resolve({ data: { user: staleUser } });

    await expect(pending).resolves.toEqual({ success: false, cancelled: true });
    expect(mocks.get).toHaveBeenCalledWith('/auth/me', { signal: controller.signal });
    expect(mocks.setAuth).not.toHaveBeenCalled();
    expect(mocks.clearAuth).not.toHaveBeenCalled();
    expect(mocks.store.user).toBeNull();
    expect(mocks.store.isAuthenticated).toBe(false);
  });

  it('does not clear a newly selected identity when an aborted old request later rejects with 401', async () => {
    const reply = deferred<never>();
    const controller = new AbortController();
    mocks.get.mockReturnValueOnce(reply.promise);
    const pending = restoreSession(controller.signal);
    controller.abort();
    mocks.store.user = { ...verifiedUser };
    reply.reject(authError(401));

    await expect(pending).resolves.toEqual({ success: false, cancelled: true });
    expect(mocks.clearAuth).not.toHaveBeenCalled();
    expect(mocks.setAuth).not.toHaveBeenCalled();
    expect(mocks.store.user).toEqual(verifiedUser);
  });

  it('ignores a pending tenant profile once an account transition pauses tenant refresh', async () => {
    const reply = deferred<{ data: { user: User } }>();
    mocks.get.mockReturnValueOnce(reply.promise);
    const pending = restoreSession();
    mocks.paused = true;
    mocks.store.user = null;
    mocks.store.isAuthenticated = false;
    reply.resolve({ data: { user: staleUser } });

    await expect(pending).resolves.toEqual({ success: false, cancelled: true });
    expect(mocks.setAuth).not.toHaveBeenCalled();
    expect(mocks.clearAuth).not.toHaveBeenCalled();
    expect(mocks.store.user).toBeNull();
  });
});

describe('protected content waits for a verified session', () => {
  it('does not render dashboard content from the persisted user while verification is pending', async () => {
    const reply = deferred<{ data: { user: User } }>();
    mocks.get.mockReturnValueOnce(reply.promise);
    render(<SessionProvider><p>Protected dashboard content</p></SessionProvider>);

    expect(screen.queryByText('Protected dashboard content')).toBeNull();
    expect(screen.getByText('loading')).toBeTruthy();
    expect(mocks.get).toHaveBeenCalledTimes(1);
    await act(async () => { reply.resolve({ data: { user: verifiedUser } }); });

    expect(screen.getByText('Protected dashboard content')).toBeTruthy();
    expect(mocks.store.user?.role).toBe('TEACHER');
    expect(mocks.start).toHaveBeenCalledTimes(1);
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('keeps protected content hidden after an outage and lets the user retry without losing the session', async () => {
    mocks.get.mockRejectedValueOnce(authError(503));
    mocks.get.mockResolvedValueOnce({ data: { user: verifiedUser, canSelectOrganization: true } });
    render(<SessionProvider><p>Protected dashboard content</p></SessionProvider>);

    await screen.findByRole('alert');
    expect(screen.queryByText('Protected dashboard content')).toBeNull();
    expect(mocks.clearAuth).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.start).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'try_again' }));
    await screen.findByText('Protected dashboard content');
    expect(mocks.get).toHaveBeenCalledTimes(2);
    expect(mocks.store.user).toEqual({ ...verifiedUser, can_switch_center: true });
    expect(mocks.clearAuth).not.toHaveBeenCalled();
    expect(mocks.start).toHaveBeenCalledTimes(1);
  });

  it('redirects to login after an actual authentication rejection without rendering stale content', async () => {
    mocks.get.mockRejectedValueOnce(authError(401));
    render(<SessionProvider><p>Protected dashboard content</p></SessionProvider>);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('Protected dashboard content')).toBeNull();
    expect(mocks.clearAuth).toHaveBeenCalledTimes(1);
    expect(mocks.start).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith('/login?redirect=%2F');
  });

  it('aborts an unmounted provider and prevents a late response from restarting its old tenant session', async () => {
    const reply = deferred<{ data: { user: User } }>();
    mocks.get.mockReturnValueOnce(reply.promise);
    const view = render(<SessionProvider><p>Protected dashboard content</p></SessionProvider>);
    const signal = mocks.get.mock.calls[0][1].signal as AbortSignal;
    expect(signal.aborted).toBe(false);
    expect(mocks.resume).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(signal.aborted).toBe(true);
    mocks.store.user = null;
    mocks.store.isAuthenticated = false;
    await act(async () => { reply.resolve({ data: { user: staleUser } }); });

    expect(mocks.store.user).toBeNull();
    expect(mocks.setAuth).not.toHaveBeenCalled();
    expect(mocks.clearAuth).not.toHaveBeenCalled();
    expect(mocks.start).not.toHaveBeenCalled();
    expect(mocks.stop).toHaveBeenCalledTimes(1);
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
