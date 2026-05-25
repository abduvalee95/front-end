import { useQuery } from '@tanstack/react-query';
import { dashboardService, type DashboardQuery } from '@/services/dashboard';
import { queryKeys } from '@/lib/api/query-keys';
import { useAuthStore } from '@/store/auth.store';

const asRecord = (q?: DashboardQuery): Record<string, unknown> | undefined =>
  q ? { ...q } : undefined;

export function useDashboardSummary(query?: DashboardQuery) {
  const orgId = useAuthStore((s) => s.user?.organization_id);
  return useQuery({
    queryKey: queryKeys.dashboard.summary(orgId, asRecord(query)),
    queryFn: () => dashboardService.getSummary(query),
    enabled: !!orgId,
  });
}

export function useLeadsByStatus(query?: DashboardQuery) {
  const orgId = useAuthStore((s) => s.user?.organization_id);
  return useQuery({
    queryKey: queryKeys.dashboard.leadsByStatus(orgId, asRecord(query)),
    queryFn: () => dashboardService.getLeadsByStatus(query),
    enabled: !!orgId,
  });
}

export function usePaymentsByMethod(query?: DashboardQuery) {
  const orgId = useAuthStore((s) => s.user?.organization_id);
  return useQuery({
    queryKey: queryKeys.dashboard.paymentsByMethod(orgId, asRecord(query)),
    queryFn: () => dashboardService.getPaymentsByMethod(query),
    enabled: !!orgId,
  });
}

export function usePaymentsByDay(query?: DashboardQuery) {
  const orgId = useAuthStore((s) => s.user?.organization_id);
  return useQuery({
    queryKey: queryKeys.dashboard.paymentsByDay(orgId, asRecord(query)),
    queryFn: () => dashboardService.getPaymentsByDay(query),
    enabled: !!orgId,
  });
}
