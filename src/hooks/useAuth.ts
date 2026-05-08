import axios, { AxiosError } from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import type { LoginCredentials } from '@/types/auth';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const { data } = await api.post('/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.user);
      toast.success(`Welcome, ${data.user.full_name}!`);

      // Role asosida yo'naltirish
      if (data.user.role === 'SUPER_ADMIN' || data.user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || 'Kirishda xatolik yuz berdi';
      toast.error(message);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Use local Next.js API route instead of proxied backend
      // This ensures cookies are cleared even if backend logout fails
      await axios.post('/api/auth/logout');
    },
    onSuccess: () => {
      toast.success('Logged out successfully');
    },
    onError: (error: AxiosError) => {
      toast.error('Logout failed, but clearing local session');
    },
    onSettled: () => {
      // SENIOR APPROACH: Perform a hard refresh to login page
      // 1. Clear sensitive auth store (Zustand)
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
    logout: logoutMutation.mutate,
    isLoading: loginMutation.isPending || logoutMutation.isPending,
    user,
    isHydrated,
    isAuthenticated,
  };
}
