import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectService } from '@/services/subjects';
import { queryKeys } from '@/lib/api/query-keys';
import { useAuthStore } from '@/store/auth.store';
import type { CreateSubjectPayload, UpdateSubjectPayload } from '@/types/subject';

export function useSubjects(enabled = true) {
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useQuery({
    queryKey: queryKeys.subjects.list(orgId),
    queryFn: () => subjectService.getSubjects(),
    enabled: enabled && !!orgId,
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useMutation({
    mutationFn: (data: CreateSubjectPayload) => subjectService.createSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all(orgId) });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubjectPayload }) =>
      subjectService.updateSubject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all(orgId) });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useMutation({
    mutationFn: (id: string) => subjectService.deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all(orgId) });
    },
  });
}
