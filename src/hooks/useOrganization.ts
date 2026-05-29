import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { organizationService, OrganizationSettings } from '@/services/organization';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { useAuthStore } from '@/store/auth.store';

export function useOrganizationSettings() {
  // Only ADMIN/MANAGER/SUPER_ADMIN can read org settings on the backend.
  // Teachers would get a 403, which the API client surfaces as an error toast
  // on every page (the sidebar mounts this hook). Guard so it never fires for them.
  const role = useAuthStore((s) => s.user?.role);
  const canRead = role === 'ADMIN' || role === 'MANAGER' || role === 'SUPER_ADMIN';

  return useQuery({
    queryKey: ['organization-settings'],
    queryFn: () => organizationService.getSettings(),
    enabled: canRead,
  });
}

export function useUpdateOrganizationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<OrganizationSettings>) => 
      organizationService.updateSettings(payload),
    onSuccess: () => {
      toast.success('Settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['organization-settings'] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    }
  });
}

export function useUploadOrganizationLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => organizationService.uploadLogo(file),
    onSuccess: () => {
      toast.success('Logo uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['organization-settings'] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message || 'Failed to upload logo');
    },
  });
}
