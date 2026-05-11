import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { organizationService, OrganizationSettings } from '@/services/organization';
import { toast } from 'sonner';

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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    }
  });
}
