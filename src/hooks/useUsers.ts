import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { userService, UserQueryParams } from '@/services/users';
import type { InviteUserDto } from '@/types/user';
import type { User } from '@/types/auth';

import { useAuthStore } from '@/store/auth.store';

const USERS_KEY = 'users';

export function useUsers(params?: UserQueryParams) {
  const user = useAuthStore((state) => state.user);
  
  return useQuery({
    queryKey: [USERS_KEY, params, user?.role],
    queryFn: () => userService.getUsers(params, user?.role === 'SUPER_ADMIN' ? 'proxy/platform/users' : undefined),
    enabled: !!user,
  });
}

interface InviteUserResponse {
  user: User;
  temporaryPassword?: string;
}

export function useInviteUser(options?: { showToast?: boolean }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: InviteUserDto) => {
      const { data } = await api.post<InviteUserResponse>('proxy/organizations/users', payload);
      return data;
    },
    onSuccess: (data) => {
      // Only show success toast if not explicitly disabled in hook options
      if (options?.showToast !== false) {
        toast.success('User invited successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to invite user';
      toast.error(message);
    },
  });
}
