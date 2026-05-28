import { useQuery } from '@tanstack/react-query';
import { dashboardService, type DashboardQuery } from '@/services/dashboard';
import { queryKeys } from '@/lib/api/query-keys';
import { useAuthStore } from '@/store/auth.store';

const asRecord = (q?: DashboardQuery): Record<string, unknown> | undefined =>
  q ? { ...q } : undefined;

// Teachers don't have access to financial/analytics endpoints — guard all admin-only queries.
const useIsAdmin = () => {
  const role = useAuthStore((s) => s.user?.role);
  return role === 'ADMIN' || role === 'MANAGER' || role === 'SUPER_ADMIN';
};

export function useDashboardSummary(query?: DashboardQuery) {
  const orgId = useAuthStore((s) => s.user?.organization_id);
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: queryKeys.dashboard.summary(orgId, asRecord(query)),
    queryFn: () => dashboardService.getSummary(query),
    enabled: !!orgId && isAdmin,
  });
}

export function useLeadsByStatus(query?: DashboardQuery) {
  const orgId = useAuthStore((s) => s.user?.organization_id);
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: queryKeys.dashboard.leadsByStatus(orgId, asRecord(query)),
    queryFn: () => dashboardService.getLeadsByStatus(query),
    enabled: !!orgId && isAdmin,
  });
}

export function usePaymentsByMethod(query?: DashboardQuery) {
  const orgId = useAuthStore((s) => s.user?.organization_id);
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: queryKeys.dashboard.paymentsByMethod(orgId, asRecord(query)),
    queryFn: () => dashboardService.getPaymentsByMethod(query),
    enabled: !!orgId && isAdmin,
  });
}

export function usePaymentsByDay(query?: DashboardQuery) {
  const orgId = useAuthStore((s) => s.user?.organization_id);
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: queryKeys.dashboard.paymentsByDay(orgId, asRecord(query)),
    queryFn: () => dashboardService.getPaymentsByDay(query),
    enabled: !!orgId && isAdmin,
  });
}
