import { useQueries, useQuery } from '@tanstack/react-query';
import { studentService } from '@/services/students';
import { queryKeys } from '@/lib/api/query-keys';
import { useAuthStore } from '@/store/auth.store';
import type { StudentQueryParams } from '@/types/student';

export const STUDENTS_KEYS = {
  all: ['students'] as const,
  lists: () => [...STUDENTS_KEYS.all, 'list'] as const,
  detail: (id: string) => [...STUDENTS_KEYS.all, 'detail', id] as const,
};

export function useStudents(params: StudentQueryParams, enabled = true) {
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useQuery({
    queryKey: queryKeys.students.list(orgId, params.page ?? 1, params.limit ?? 50),
    queryFn: () => studentService.getStudents(params),
    enabled: enabled && !!orgId,
  });
}

export function useStudentGroups(enabled = true) {
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useQuery({
    queryKey: [...queryKeys.students.all(orgId), 'groups'] as const,
    queryFn: () => studentService.getGroups(),
    enabled: enabled && !!orgId,
  });
}

export function useGroupEnrollments(groupIds: string[], enabled: boolean) {
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useQueries({
    queries: groupIds.map((groupId) => ({
      queryKey: [...queryKeys.students.all(orgId), 'group-enrollments', groupId] as const,
      queryFn: () => studentService.getEnrollmentsByGroup(groupId),
      enabled: enabled && !!orgId,
    })),
  });
}
