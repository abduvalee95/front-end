import { useQuery } from '@tanstack/react-query';
import { groupService } from '@/services/groups';
import { useAuthStore } from '@/store/auth.store';

export const GROUPS_KEYS = {
  all: (orgId: string | undefined) => ['groups', orgId] as const,
  list: (orgId: string | undefined) => [...GROUPS_KEYS.all(orgId), 'list'] as const,
  detail: (orgId: string | undefined, id: string) => [...GROUPS_KEYS.all(orgId), 'detail', id] as const,
  schedule: (orgId: string | undefined, id: string) => [...GROUPS_KEYS.all(orgId), 'schedule', id] as const,
};

export function useGroups(enabled = true) {
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useQuery({
    queryKey: GROUPS_KEYS.list(orgId),
    queryFn: () => groupService.getGroups(),
    enabled: enabled && !!orgId,
  });
}

export function useGroupDetail(groupId: string, enabled = true) {
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useQuery({
    queryKey: GROUPS_KEYS.detail(orgId, groupId),
    queryFn: () => groupService.getGroupById(groupId),
    enabled: enabled && !!groupId && !!orgId,
  });
}

export function useGroupSchedule(groupId: string, enabled = true) {
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useQuery({
    queryKey: GROUPS_KEYS.schedule(orgId, groupId),
    queryFn: () => groupService.getSchedule(groupId),
    enabled: enabled && !!groupId && !!orgId,
  });
}
