import { useQuery } from '@tanstack/react-query';
import { courseService } from '@/services/courses';

export const COURSES_KEYS = {
  all: ['courses'] as const,
  list: () => [...COURSES_KEYS.all, 'list'] as const,
};

export function useCourses(enabled = true) {
  return useQuery({
    queryKey: COURSES_KEYS.list(),
    queryFn: () => courseService.getCourses(),
    enabled,
  });
}
