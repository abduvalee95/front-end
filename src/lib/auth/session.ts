/**
 * Session Management Service
 * Enterprise SaaS Grade Session Lifecycle Management
 */

import { api } from '@/lib/api/client';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import { User, MeResponse } from '@/types/auth';
import { logger } from '@/lib/logger';
import axios from 'axios';

interface SessionResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Restore session on app load
 */
export async function restoreSession(): Promise<SessionResult> {
  const store = useAuthStore.getState();
  
  if (store.isAuthenticated && store.user) {
    return { success: true, user: store.user as unknown as MeResponse['user'] };
  }

  try {
    store.setLoading(true);
    
    // Bizning api klientimiz /api/proxy bazasini o'zi qo'shadi
    const response = await api.get<MeResponse>('/auth/me');

    const user = response.data.user;
    store.setAuth(user);
    
    return { success: true, user };
  } catch (error) {
    // 401 yoki 404 (agar endpoint bo'lmasa) sessiya yo'qligini bildiradi
    if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 404)) {
      store.clearAuth();
      return { success: false, error: 'Not authenticated' };
    }
    
    logger.error('Session restoration error:', error);
    store.clearAuth();
    
    return { success: false, error: 'Failed to restore session' };
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
    await api.post('/auth/logout');
    store.clearAuth();
    toast.success('Tizimdan muvaffaqiyatli chiqildi');
  } catch (error) {
    logger.error('Logout error:', error);
    store.clearAuth();
    toast.error('Logoutda xatolik, lekin profil tozalandi');
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
