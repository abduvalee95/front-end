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
  PaginatedLeads,
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
      .get<DashboardSummary>('dashboard/summary', { params: rangeQuery(range) })
      .then((r) => r.data);
  },

  getLeadsByStatus(range: RangeParams): Promise<LeadStatusCount[]> {
    return api
      .get<LeadStatusCount[]>('dashboard/analytics/leads-by-status', {
        params: rangeQuery(range),
      })
      .then((r) => r.data);
  },

  getPaymentsByMethod(range: RangeParams): Promise<PaymentsByMethod[]> {
    return api
      .get<PaymentsByMethod[]>('dashboard/analytics/payments-by-method', {
        params: rangeQuery(range),
      })
      .then((r) => r.data);
  },

  getPaymentsByDay(range: RangeParams): Promise<PaymentsByDay[]> {
    return api
      .get<PaymentsByDay[]>('dashboard/analytics/payments-by-day', {
        params: rangeQuery(range),
      })
      .then((r) => r.data);
  },

  getFinanceSummary(range: RangeParams): Promise<FinanceSummary> {
    return api
      .get<FinanceSummary>('finance/summary', { params: rangeQuery(range) })
      .then((r) => r.data);
  },

  getFinanceReport(range: RangeParams): Promise<FinanceReport> {
    return api
      .get<FinanceReport>('finance/report', { params: rangeQuery(range) })
      .then((r) => r.data);
  },

  listLeads(params: RangeParams & { page?: number; limit?: number }): Promise<PaginatedLeads> {
    return api
      .get<PaginatedLeads>('lead', {
        params: { ...rangeQuery(params), page: params.page ?? 1, limit: params.limit ?? 200 },
      })
      .then((r) => r.data);
  },

  listCourses(): Promise<Course[] | { items: Course[] }> {
    return api.get('course').then((r) => r.data);
  },

  listInvoices(params: { status?: string; page?: number; limit?: number }): Promise<PaginatedInvoices> {
    return api
      .get<PaginatedInvoices>('billing/invoices', {
        params: { page: params.page ?? 1, limit: params.limit ?? 100, status: params.status },
      })
      .then((r) => r.data);
  },

  createLead(data: { full_name: string; phone: string; source: string }): Promise<any> {
    return api.post('lead', data).then((r) => r.data);
  },
};
