import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { organizationService, OrganizationSettings } from '@/services/organization';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { useAuthStore } from '@/store/auth.store';

export function useOrganizationSettings() {
  // The backend's /organizations/settings routes are guarded with
  // @Roles(ADMIN, MANAGER) only — TEACHER and SUPER_ADMIN (the platform
  // account) always get a 403, which the API client surfaces as an error
  // toast on every page (the sidebar mounts this hook). Only query for the
  // roles the backend actually allows.
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const canRead =
    !!user?.organization_id && (role === 'ADMIN' || role === 'MANAGER');

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
