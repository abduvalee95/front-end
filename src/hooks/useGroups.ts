import { useQuery } from '@tanstack/react-query';
import { groupService } from '@/services/groups';

export const GROUPS_KEYS = {
  all: ['groups'] as const,
  list: () => [...GROUPS_KEYS.all, 'list'] as const,
  detail: (id: string) => [...GROUPS_KEYS.all, 'detail', id] as const,
  schedule: (id: string) => [...GROUPS_KEYS.all, 'schedule', id] as const,
};

export function useGroups(enabled = true) {
  return useQuery({
    queryKey: GROUPS_KEYS.list(),
    queryFn: () => groupService.getGroups(),
    enabled,
  });
}

export function useGroupDetail(groupId: string, enabled = true) {
  return useQuery({
    queryKey: GROUPS_KEYS.detail(groupId),
    queryFn: () => groupService.getGroupById(groupId),
    enabled: enabled && !!groupId,
  });
}

export function useGroupSchedule(groupId: string, enabled = true) {
  return useQuery({
    queryKey: GROUPS_KEYS.schedule(groupId),
    queryFn: () => groupService.getSchedule(groupId),
    enabled: enabled && !!groupId,
  });
}
