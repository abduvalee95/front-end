import { useQuery } from '@tanstack/react-query';
import { dashboardService, type DashboardQuery } from '@/services/dashboard';

export const DASHBOARD_KEYS = {
  all: ['dashboard'] as const,
  summary: (query?: DashboardQuery) => [...DASHBOARD_KEYS.all, 'summary', query] as const,
  leadsByStatus: (query?: DashboardQuery) => [...DASHBOARD_KEYS.all, 'leads-by-status', query] as const,
  paymentsByMethod: (query?: DashboardQuery) => [...DASHBOARD_KEYS.all, 'payments-by-method', query] as const,
  paymentsByDay: (query?: DashboardQuery) => [...DASHBOARD_KEYS.all, 'payments-by-day', query] as const,
};

export function useDashboardSummary(query?: DashboardQuery) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.summary(query),
    queryFn: () => dashboardService.getSummary(query),
  });
}

export function useLeadsByStatus(query?: DashboardQuery) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.leadsByStatus(query),
    queryFn: () => dashboardService.getLeadsByStatus(query),
  });
}

export function usePaymentsByMethod(query?: DashboardQuery) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.paymentsByMethod(query),
    queryFn: () => dashboardService.getPaymentsByMethod(query),
  });
}

export function usePaymentsByDay(query?: DashboardQuery) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.paymentsByDay(query),
    queryFn: () => dashboardService.getPaymentsByDay(query),
  });
}
