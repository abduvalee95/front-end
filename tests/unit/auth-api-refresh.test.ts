import axios, { AxiosError, CanceledError, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authRequest: vi.fn(),
  toast: vi.fn(),
  state: { isAuthenticated: false, clearAuth: vi.fn() },
}));

vi.mock('@/lib/auth/account-client', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/auth/account-client')>(),
  authRequest: mocks.authRequest,
}));
vi.mock('@/store/auth.store', () => ({ useAuthStore: { getState: () => mocks.state } }));
vi.mock('sonner', () => ({ toast: { error: mocks.toast } }));
vi.mock('@/lib/i18n/toast', () => ({ tt: (key: string) => key }));
vi.mock('@/lib/logger', () => ({ logger: { debug: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

let api: typeof import('@/lib/api/client')['api'];
let pause: typeof import('@/lib/auth/tenant-refresh')['pauseTenantRefresh'];

function unauthorized(config: InternalAxiosRequestConfig) {
  return new AxiosError('Unauthorized', AxiosError.ERR_BAD_REQUEST, config, {}, {
    data: {}, status: 401, statusText: 'Unauthorized', config, headers: {},
  });
}

function deferred() {
  let resolve!: (value: unknown) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

beforeEach(async () => {
  vi.resetModules();
  mocks.authRequest.mockReset().mockResolvedValue({ success: true });
  mocks.toast.mockClear();
  mocks.state.clearAuth.mockClear();
  mocks.state.isAuthenticated = false;
  vi.stubGlobal('window', { location: { href: '/dashboard' } });
  ({ api } = await import('@/lib/api/client'));
  ({ pauseTenantRefresh: pause } = await import('@/lib/auth/tenant-refresh'));
});

afterEach(() => { vi.unstubAllGlobals(); });

describe('Axios session refresh during account transitions', () => {
  it('restores a fresh browser through refresh when /auth/me returns 401', async () => {
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      if (!(config as InternalAxiosRequestConfig & { _retry?: boolean })._retry) throw unauthorized(config);
      return { data: { user: { id: 'restored-user' } }, status: 200, statusText: 'OK', config, headers: {} };
    });
    api.defaults.adapter = adapter;

    const response = await api.get('/auth/me');

    expect(response.data).toEqual({ user: { id: 'restored-user' } });
    expect(adapter).toHaveBeenCalledTimes(2);
    expect(mocks.authRequest).toHaveBeenCalledExactlyOnceWith('/api/auth/refresh', { method: 'POST', body: '{}' });
    expect(mocks.state.clearAuth).not.toHaveBeenCalled();
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  it('does not restore an old tenant from /auth/me while an account transition is paused', async () => {
    pause();
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => { throw unauthorized(config); });
    api.defaults.adapter = adapter;

    await expect(api.get('/auth/me')).rejects.toMatchObject({ response: { status: 401 } });

    expect(adapter).toHaveBeenCalledTimes(1);
    expect(mocks.authRequest).not.toHaveBeenCalled();
    expect(mocks.state.clearAuth).not.toHaveBeenCalled();
    expect(window.location.href).toBe('/dashboard');
  });

  it('does not refresh a tenant API 401 while transitioning even if its old profile is persisted', async () => {
    mocks.state.isAuthenticated = true;
    pause();
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => { throw unauthorized(config); });
    api.defaults.adapter = adapter;

    await expect(api.get('/proxy/student')).rejects.toMatchObject({ response: { status: 401 } });

    expect(adapter).toHaveBeenCalledTimes(1);
    expect(mocks.authRequest).not.toHaveBeenCalled();
    expect(mocks.state.clearAuth).not.toHaveBeenCalled();
    expect(window.location.href).toBe('/dashboard');
  });

  it('treats an aborted session request as cancellation without a toast, refresh or logout', async () => {
    api.defaults.adapter = async config => {
      const error = new CanceledError('Aborted session request');
      error.config = config;
      error.request = {};
      throw error;
    };

    await expect(api.get('/auth/me')).rejects.toSatisfy(axios.isCancel);

    expect(mocks.authRequest).not.toHaveBeenCalled();
    expect(mocks.toast).not.toHaveBeenCalled();
    expect(mocks.state.clearAuth).not.toHaveBeenCalled();
    expect(window.location.href).toBe('/dashboard');
  });

  it('does not retry in-flight or queued requests after refresh completes during a transition', async () => {
    mocks.state.isAuthenticated = true;
    const refresh = deferred();
    mocks.authRequest.mockReturnValue(refresh.promise);
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => { throw unauthorized(config); });
    api.defaults.adapter = adapter;

    const first = expect(api.get('/proxy/student')).rejects.toThrow('AUTH_TRANSITION');
    await vi.waitFor(() => expect(mocks.authRequest).toHaveBeenCalledTimes(1));
    const queued = expect(api.get('/proxy/groups')).rejects.toThrow('AUTH_TRANSITION');
    await vi.waitFor(() => expect(adapter).toHaveBeenCalledTimes(2));
    pause();
    refresh.resolve({ success: true });
    await Promise.all([first, queued]);

    expect(adapter).toHaveBeenCalledTimes(2);
    expect(mocks.authRequest).toHaveBeenCalledTimes(1);
    expect(mocks.toast).not.toHaveBeenCalled();
    expect(mocks.state.clearAuth).not.toHaveBeenCalled();
    expect(window.location.href).toBe('/dashboard');
  });

  it('does not log out the new account if an old in-flight refresh is rejected after pause', async () => {
    mocks.state.isAuthenticated = true;
    const refresh = deferred();
    mocks.authRequest.mockReturnValue(refresh.promise);
    api.defaults.adapter = async config => { throw unauthorized(config); };
    const { AuthApiError } = await import('@/lib/auth/account-client');

    const result = expect(api.get('/proxy/student')).rejects.toMatchObject({ status: 401 });
    await vi.waitFor(() => expect(mocks.authRequest).toHaveBeenCalledTimes(1));
    pause();
    refresh.reject(new AuthApiError(401, 'UNAUTHENTICATED'));
    await result;

    expect(mocks.authRequest).toHaveBeenCalledTimes(1);
    expect(mocks.toast).not.toHaveBeenCalled();
    expect(mocks.state.clearAuth).not.toHaveBeenCalled();
    expect(window.location.href).toBe('/dashboard');
  });

  it('returns a still-signed-in account to center selection when its tenant session expires', async () => {
    mocks.state.isAuthenticated = true;
    const { AuthApiError } = await import('@/lib/auth/account-client');
    mocks.authRequest.mockRejectedValue(new AuthApiError(401, 'TENANT_SESSION_EXPIRED'));
    api.defaults.adapter = async config => { throw unauthorized(config); };

    await expect(api.get('/proxy/student')).rejects.toMatchObject({ code: 'TENANT_SESSION_EXPIRED' });

    expect(mocks.authRequest).toHaveBeenCalledExactlyOnceWith('/api/auth/refresh', { method: 'POST', body: '{}' });
    expect(mocks.state.clearAuth).toHaveBeenCalledTimes(1);
    expect(mocks.toast).not.toHaveBeenCalled();
    expect(window.location.href).toBe('/onboarding');
    const { isTenantRefreshPaused } = await import('@/lib/auth/tenant-refresh');
    expect(isTenantRefreshPaused()).toBe(true);
  });
});
