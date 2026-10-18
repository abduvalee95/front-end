import { authRequest } from '@/lib/auth/account-client';
import type { User } from '@/types/auth';
import { silentRefreshManager } from '@/lib/auth/silent-refresh';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import { useTranslations } from '@/i18n';
import type { LoginCredentials } from '@/types/auth';
import { pauseTenantRefresh, resumeTenantRefresh, waitForPendingTenantRefresh } from '@/lib/auth/tenant-refresh';

export function useAuth() {
  const t = useTranslations('auth_design');
  const router = useRouter();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      // Invalid credentials must not trigger the shared client's session-refresh loop.
      pauseTenantRefresh(); clearAuth(); silentRefreshManager.stop();
      await waitForPendingTenantRefresh();
      return authRequest<{ user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
    },
    onSuccess: (data) => {
      queryClient.clear();
      resumeTenantRefresh();
      setAuth(data.user);
      toast.success(`Welcome, ${data.user.full_name}!`);

      // Role asosida yo'naltirish
      if (data.user.role === 'SUPER_ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    },
    onError: () => {
      const message = t('login_error');
      toast.error(message);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Use local Next.js API route instead of proxied backend
      // This ensures cookies are cleared even if backend logout fails
      pauseTenantRefresh(); clearAuth(); silentRefreshManager.stop();
      await waitForPendingTenantRefresh();
      await authRequest('/api/auth/logout', { method: 'POST', body: '{}' });
    },
    onSuccess: () => {
      toast.success('Logged out successfully');
    },
    onError: () => {
      toast.error('Logout failed, but clearing local session');
    },
    onSettled: () => {
      // SENIOR APPROACH: Perform a hard refresh to login page
      // 1. Clear sensitive auth store (Zustand)
      silentRefreshManager.stop();
      clearAuth();
      
      // 2. Completely clear React Query cache to prevent data leakage
      queryClient.clear();
      
      // 3. Force a full page reload to purge any in-memory singletons or state
      // This is safer than router.push for SaaS-grade logout
      window.location.href = '/login';
    },
  });

  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return {
    login: loginMutation.mutate,
    loginError: loginMutation.isError ? t('login_error') : null,
    logout: logoutMutation.mutate,
    isLoading: loginMutation.isPending || logoutMutation.isPending,
    user,
    isHydrated,
    isAuthenticated,
  };
}
