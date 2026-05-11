/**
 * Analytics service — thin axios wrappers around confirmed backend endpoints.
 * Every call goes through `/api/proxy/` (see lib/api/client.ts + middleware.ts)
 * which injects the access token cookie as Authorization: Bearer.
 */

import { api } from '@/lib/api/client';
import type {
  DashboardSummary,
  LeadStatusCount,
  PaymentsByMethod,
  PaymentsByDay,
  FinanceSummary,
  FinanceReport,
  Course,
  PaginatedInvoices,
} from '@/types/analytics';

function formatDate(d: Date | null | undefined): string | undefined {
  if (!d) return undefined;
  return d.toISOString().slice(0, 10);
}

export interface RangeParams {
  from?: Date | null;
  to?: Date | null;
}

function rangeQuery(params: RangeParams): Record<string, string> {
  const q: Record<string, string> = {};
  const from = formatDate(params.from);
  const to = formatDate(params.to);
  if (from) q.from = from;
  if (to) q.to = to;
  return q;
}

export const analyticsService = {
  getDashboardSummary(range: RangeParams): Promise<DashboardSummary> {
    return api
      .get<DashboardSummary>('proxy/dashboard/summary', { params: rangeQuery(range) })
      .then((r) => r.data);
  },

  getLeadsByStatus(range: RangeParams): Promise<LeadStatusCount[]> {
    return api
      .get<LeadStatusCount[]>('proxy/dashboard/analytics/leads-by-status', {
        params: rangeQuery(range),
      })
      .then((r) => r.data);
  },

  getPaymentsByMethod(range: RangeParams): Promise<PaymentsByMethod[]> {
    return api
      .get<PaymentsByMethod[]>('proxy/dashboard/analytics/payments-by-method', {
        params: rangeQuery(range),
      })
      .then((r) => r.data);
  },

  getPaymentsByDay(range: RangeParams): Promise<PaymentsByDay[]> {
    return api
      .get<PaymentsByDay[]>('proxy/dashboard/analytics/payments-by-day', {
        params: rangeQuery(range),
      })
      .then((r) => r.data);
  },

  getFinanceSummary(range: RangeParams): Promise<FinanceSummary> {
    return api
      .get<FinanceSummary>('proxy/finance/summary', { params: rangeQuery(range) })
      .then((r) => r.data);
  },

  getFinanceReport(range: RangeParams): Promise<FinanceReport> {
    return api
      .get<FinanceReport>('proxy/finance/report', { params: rangeQuery(range) })
      .then((r) => r.data);
  },

  listCourses(): Promise<Course[] | { items: Course[] }> {
    return api.get('proxy/course').then((r) => r.data);
  },

  listInvoices(params: { status?: string; page?: number; limit?: number }): Promise<PaginatedInvoices> {
    return api
      .get<PaginatedInvoices>('proxy/billing/invoices', {
        params: { page: params.page ?? 1, limit: params.limit ?? 100, status: params.status },
      })
      .then((r) => r.data);
  },
};
