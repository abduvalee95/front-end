import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { journalService } from '@/services/journal';
import { queryKeys } from '@/lib/api/query-keys';
import { getErrorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/store/auth.store';
import type { CreateJournalDto, JournalQueryParams } from '@/types/journal';

export function useJournalByGroup(groupId: string, params?: JournalQueryParams, enabled = true) {
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useQuery({
    queryKey: queryKeys.journal.byGroup(orgId, groupId, (params ?? {}) as Record<string, unknown>),
    queryFn: () => journalService.findByGroup(groupId, params),
    enabled: enabled && !!orgId && !!groupId,
  });
}

export function useJournalByTeacher(teacherId: string, params?: JournalQueryParams, enabled = true) {
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useQuery({
    queryKey: queryKeys.journal.byTeacher(orgId, teacherId, (params ?? {}) as Record<string, unknown>),
    queryFn: () => journalService.findByTeacher(teacherId, params),
    enabled: enabled && !!orgId && !!teacherId,
  });
}

export function useJournal(params?: JournalQueryParams, enabled = true) {
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useQuery({
    queryKey: queryKeys.journal.list(orgId, (params ?? {}) as Record<string, unknown>),
    queryFn: () => journalService.findAll(params),
    enabled: enabled && !!orgId,
  });
}

export function useUpsertJournal() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useMutation({
    mutationFn: (data: CreateJournalDto) => journalService.upsertEntries(data),
    onSuccess: () => {
      toast.success('Журнал сохранён');
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.all(orgId) });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || 'Ошибка при сохранении');
    },
  });
}
