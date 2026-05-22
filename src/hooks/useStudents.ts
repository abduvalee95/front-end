import { useQueries, useQuery } from '@tanstack/react-query';
import { studentService } from '@/services/students';
import { queryKeys } from '@/lib/api/query-keys';
import { useAuthStore } from '@/store/auth.store';
import type { StudentQueryParams } from '@/types/student';


export function useStudents(params: StudentQueryParams, enabled = true) {
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useQuery({
    queryKey: queryKeys.students.list(orgId, params.page ?? 1, params.limit ?? 50, params.search, params.status),
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

export function useStudentDetail(id: string, enabled = true) {
  const { user } = useAuthStore();
  const orgId = user?.organization_id;
  const isEnabled = enabled && !!orgId && !!id;

  const detailQuery = useQuery({
    queryKey: [...queryKeys.students.all(orgId), 'student-detail', id] as const,
    queryFn: () => studentService.getStudentDetail(id),
    enabled: isEnabled,
  });

  return {
    data: detailQuery.data,
    isLoading: detailQuery.isLoading,
    isError: detailQuery.isError,
  };
}

export function useStudentStatistics(enabled = true) {
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useQuery({
    queryKey: [...queryKeys.students.all(orgId), 'statistics'] as const,
    queryFn: () => studentService.getStatistics(),
    enabled: enabled && !!orgId,
  });
}
