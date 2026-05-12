import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { organizationService, OrganizationSettings } from '@/services/organization';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

export function useOrganizationSettings() {
  return useQuery({
    queryKey: ['organization-settings'],
    queryFn: () => organizationService.getSettings(),
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
