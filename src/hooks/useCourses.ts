import { useQuery } from '@tanstack/react-query';
import { courseService } from '@/services/courses';
import { queryKeys } from '@/lib/api/query-keys';
import { useAuthStore } from '@/store/auth.store';

export function useCourses(enabled = true) {
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useQuery({
    queryKey: queryKeys.courses.list(orgId),
    queryFn: () => courseService.getCourses(),
    enabled: enabled && !!orgId,
  });
}
