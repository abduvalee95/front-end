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

  const studentQuery = useQuery({
    queryKey: [...queryKeys.students.all(orgId), 'student', id] as const,
    queryFn: () => studentService.getStudentById(id),
    enabled: isEnabled,
  });

  const enrollmentsQuery = useQuery({
    queryKey: [...queryKeys.students.all(orgId), 'student-enrollments', id] as const,
    queryFn: () => studentService.getEnrollmentsByStudent(id),
    enabled: isEnabled,
  });

  return {
    data: studentQuery.data
      ? { ...studentQuery.data, enrollments: enrollmentsQuery.data ?? [] }
      : undefined,
    isLoading: studentQuery.isLoading || enrollmentsQuery.isLoading,
    isError: studentQuery.isError || enrollmentsQuery.isError,
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
