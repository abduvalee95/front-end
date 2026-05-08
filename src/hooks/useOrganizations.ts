/**
 * Platform / Organization Hooks
 * React Query hooks wrapping platformService.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { platformService } from '@/services/platform';
import type {
  OrganizationQueryParams,
  CreateOrganizationPayload,
  UpdateOrganizationPayload,
  OrganizationStatus,
} from '@/types/platform';
import { getErrorMessage } from '@/lib/api/client';

export const orgKeys = {
  all: ['platform-organizations'] as const,
  lists: () => [...orgKeys.all, 'list'] as const,
  list: (params: OrganizationQueryParams) => [...orgKeys.lists(), params] as const,
};

export function useOrganizations(params: OrganizationQueryParams) {
  return useQuery({
    queryKey: orgKeys.list(params),
    queryFn: () => platformService.listOrganizations(params),
  });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrganizationPayload) =>
      platformService.createOrganization(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.lists() });
      toast.success('Tashkilot muvaffaqiyatli yaratildi');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOrganizationPayload }) =>
      platformService.updateOrganization(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.lists() });
      toast.success('Tashkilot yangilandi');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useToggleOrganizationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrganizationStatus }) =>
      platformService.updateOrganizationStatus(id, { status }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: orgKeys.lists() });
      toast.success(
        vars.status === 'ACTIVE'
          ? 'Tashkilot faollashtirildi'
          : 'Tashkilot to\'xtatildi',
      );
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
