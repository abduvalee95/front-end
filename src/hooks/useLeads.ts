/**
 * Lead hooks — React Query wrappers for lead operations
 * Uses centralized queryKeys from lib/api/query-keys.ts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadService, type LeadListParams, type UpdateLeadDto } from '@/services/leads';
import { queryKeys } from '@/lib/api/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import type { CreateLeadDto } from '@/types/analytics';

/**
 * List leads with pagination and filters
 */
export function useLeads(params: LeadListParams, enabled = true) {
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useQuery({
    queryKey: queryKeys.leads.list(
      orgId,
      params.page ?? 1,
      params.limit ?? 50,
      {
        status: params.status,
        source: params.source,
        search: params.search,
        from: params.from,
        to: params.to,
      }
    ),
    queryFn: () => leadService.listLeads(params),
    enabled: enabled && !!orgId,
  });
}

/**
 * Get single lead by ID
 */
export function useLead(id: string, enabled = true) {
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useQuery({
    queryKey: queryKeys.leads.detail(orgId, id),
    queryFn: () => leadService.getLead(id),
    enabled: enabled && !!orgId && !!id,
  });
}

/**
 * Create new lead
 */
export function useCreateLead() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useMutation({
    mutationFn: (data: CreateLeadDto) => leadService.createLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.leads.all(orgId),
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboard.all(orgId),
        refetchType: 'active'
      });
      toast.success('Lead created successfully');
    },
  });
}

/**
 * Update lead (status, contact info, etc.)
 */
export function useUpdateLead() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeadDto }) =>
      leadService.updateLead(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all(orgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(orgId, variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all(orgId) });
      toast.success('Lead updated successfully');
    },
    onError: () => {
      toast.error('Failed to update lead');
    },
  });
}

/**
 * Delete lead
 */
export function useDeleteLead() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useMutation({
    mutationFn: (id: string) => leadService.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all(orgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all(orgId) });
      toast.success('Lead deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete lead');
    },
  });
}

/**
 * Convert lead to student
 */
export function useConvertLead() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useMutation({
    mutationFn: (id: string) => leadService.convertToStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all(orgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all(orgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all(orgId) });
      toast.success('Lead converted to student successfully');
    },
    onError: () => {
      toast.error('Failed to convert lead');
    },
  });
}
