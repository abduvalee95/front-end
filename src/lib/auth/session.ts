/**
 * Session Management Service
 * Enterprise SaaS Grade Session Lifecycle Management
 */

import { api } from '@/lib/api/client';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import { tt } from '@/lib/i18n/toast';
import { User, MeResponse } from '@/types/auth';
import { logger } from '@/lib/logger';
import axios from 'axios';
import { authRequest } from './account-client';
import { isTenantRefreshPaused } from './tenant-refresh';

interface SessionResult {
  success: boolean;
  user?: User;
  error?: string;
  retryable?: boolean;
  cancelled?: boolean;
}

/**
 * Restore session on app load
 */
export async function restoreSession(signal?: AbortSignal): Promise<SessionResult> {
  const store = useAuthStore.getState();
  const cancelled = () => signal?.aborted || isTenantRefreshPaused();
  if (cancelled()) return { success: false, cancelled: true };
  
  try {
    store.setLoading(true);
    
    // The api client's baseURL is '/api/', NOT '/api/proxy/', so this resolves
    // to /api/auth/me — the front-end's own route, which reads the HttpOnly
    // cookie and talks to the backend server-side. It does not go through the
    // proxy rewrite, and a test or mock that intercepts /api/proxy/auth/me
    // will silently miss it: session restore then fails, SessionProvider
    // redirects to /login, and middleware bounces the still-valid cookie
    // straight back to /dashboard. Every route looks like it "redirects to the
    // dashboard" when the real failure is one unmatched request.
    const response = await api.get<MeResponse>('/auth/me', { signal });

    // Navigating to account onboarding or logging out can finish while the
    // profile request is still in flight. Its old tenant must stay cleared.
    if (cancelled()) return { success: false, cancelled: true };

    const user = { ...response.data.user, can_switch_center: response.data.canSelectOrganization === true };
    store.setAuth(user);
    
    return { success: true, user };
  } catch (error) {
    if (cancelled() || axios.isCancel(error)) return { success: false, cancelled: true };
    // 401 yoki 404 (agar endpoint bo'lmasa) sessiya yo'qligini bildiradi
    if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 404)) {
      store.clearAuth();
      return { success: false, error: 'Not authenticated' };
    }
    
    logger.warn('Session restoration unavailable');
    
    return { success: false, error: 'Failed to restore session', retryable: true };
  } finally {
    store.setLoading(false);
  }
}

/**
 * End session (logout)
 */
export async function endSession(): Promise<void> {
  const store = useAuthStore.getState();
  
  try {
    store.setLoading(true);
    await authRequest('/api/auth/logout', { method: 'POST', body: '{}' });
    store.clearAuth();
    toast.success(tt('toasts.logout_success'));
  } catch (error) {
    logger.error('Logout error:', error);
    store.clearAuth();
    toast.error(tt('toasts.logout_error'));
  } finally {
    store.setLoading(false);
  }
}

/**
 * Check if session is valid
 */
export function isSessionValid(): boolean {
  const store = useAuthStore.getState();
  return store.isAuthenticated && !!store.user;
}

/**
 * Get current user role
 */
export function getCurrentUserRole(): string | null {
  const store = useAuthStore.getState();
  return store.user?.role || null;
}

/**
 * Check if user has required role
 */
export function hasRole(roles: string[]): boolean {
  const userRole = getCurrentUserRole();
  if (!userRole) return false;
  return roles.includes(userRole);
}

/**
 * Check if user is SUPER_ADMIN
 */
export function isSuperAdmin(): boolean {
  return getCurrentUserRole() === 'SUPER_ADMIN';
}

/**
 * Check if user is ADMIN or higher
 */
export function isAdminOrHigher(): boolean {
  const role = getCurrentUserRole();
  return role === 'SUPER_ADMIN' || role === 'ADMIN';
}
