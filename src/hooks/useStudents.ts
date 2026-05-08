import { useQueries, useQuery } from '@tanstack/react-query';
import { studentService } from '@/services/students';
import type { StudentQueryParams } from '@/types/student';

export const STUDENTS_KEYS = {
  all: ['students'] as const,
  lists: () => [...STUDENTS_KEYS.all, 'list'] as const,
  list: (params: StudentQueryParams) => [...STUDENTS_KEYS.lists(), params] as const,
  groups: () => [...STUDENTS_KEYS.all, 'groups'] as const,
  groupEnrollments: (groupId: string) => [...STUDENTS_KEYS.all, 'group-enrollments', groupId] as const,
};

export function useStudents(params: StudentQueryParams, enabled = true) {
  return useQuery({
    queryKey: STUDENTS_KEYS.list(params),
    queryFn: () => studentService.getStudents(params),
    enabled,
  });
}

export function useStudentGroups(enabled = true) {
  return useQuery({
    queryKey: STUDENTS_KEYS.groups(),
    queryFn: () => studentService.getGroups(),
    enabled,
  });
}

export function useGroupEnrollments(groupIds: string[], enabled: boolean) {
  return useQueries({
    queries: groupIds.map((groupId) => ({
      queryKey: STUDENTS_KEYS.groupEnrollments(groupId),
      queryFn: () => studentService.getEnrollmentsByGroup(groupId),
      enabled,
    })),
  });
}
