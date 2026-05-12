/**
 * Analytics hooks — React Query wrappers + DateRange context.
 */

'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subDays, startOfMonth, endOfDay } from 'date-fns';
import { analyticsService } from '@/services/analytics';
import { leadService } from '@/services/leads';
import { generatePlatformSummary, generateCRMInsights, generateLMSInsights } from '@/lib/ai/rule-based-insights';
import { STALE_TIME, QUERY_LIMITS } from '@/lib/constants';
import type { DateRange, PlatformAISummary, Insight } from '@/types/analytics';

// ─── DateRange context ────────────────────────────────────────────────
type Preset = '7d' | '30d' | '90d' | 'mtd' | 'custom';

interface DateRangeCtx {
  range: DateRange;
  preset: Preset;
  setPreset: (p: Preset) => void;
  setRange: (r: DateRange) => void;
}

const DateRangeContext = createContext<DateRangeCtx | null>(null);

function presetToRange(p: Preset): DateRange {
  const now = new Date();
  const to = endOfDay(now);
  switch (p) {
    case '7d':
      return { from: subDays(now, 6), to };
    case '30d':
      return { from: subDays(now, 29), to };
    case '90d':
      return { from: subDays(now, 89), to };
    case 'mtd':
      return { from: startOfMonth(now), to };
    default:
      return { from: subDays(now, 29), to };
  }
}

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [preset, setPresetState] = useState<Preset>('30d');
  const [range, setRangeState] = useState<DateRange>(presetToRange('30d'));

  const value = useMemo<DateRangeCtx>(
    () => ({
      range,
      preset,
      setPreset: (p: Preset) => {
        setPresetState(p);
        if (p !== 'custom') setRangeState(presetToRange(p));
      },
      setRange: (r: DateRange) => {
        setPresetState('custom');
        setRangeState(r);
      },
    }),
    [range, preset],
  );

  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
}

export function useDateRange(): DateRangeCtx {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error('useDateRange must be used inside <DateRangeProvider>');
  return ctx;
}

// ─── Query key factory ───────────────────────────────────────────────
export const analyticsKeys = {
  all: ['analytics'] as const,
  summary: (key: string) => [...analyticsKeys.all, 'summary', key] as const,
  paymentsByDay: (key: string) => [...analyticsKeys.all, 'payments-by-day', key] as const,
  paymentsByMethod: (key: string) => [...analyticsKeys.all, 'payments-by-method', key] as const,
  financeSummary: (key: string) => [...analyticsKeys.all, 'finance-summary', key] as const,
  leadsByStatus: (key: string) => [...analyticsKeys.all, 'leads-by-status', key] as const,
  leads: (key: string) => [...analyticsKeys.all, 'leads', key] as const,
  invoices: (key: string) => [...analyticsKeys.all, 'invoices', key] as const,
};

// ─── Query hooks ──────────────────────────────────────────────────────

function rangeKey(range: DateRange): string {
  return `${range.from?.toISOString() ?? 'null'}::${range.to?.toISOString() ?? 'null'}`;
}

export function usePlatformAnalytics() {
  const { range } = useDateRange();
  const key = rangeKey(range);

  const summary = useQuery({
    queryKey: analyticsKeys.summary(key),
    queryFn: () => analyticsService.getDashboardSummary(range),
    staleTime: STALE_TIME.SHORT,
  });

  const paymentsByDay = useQuery({
    queryKey: analyticsKeys.paymentsByDay(key),
    queryFn: () => analyticsService.getPaymentsByDay(range),
    staleTime: STALE_TIME.MEDIUM,
  });

  const paymentsByMethod = useQuery({
    queryKey: analyticsKeys.paymentsByMethod(key),
    queryFn: () => analyticsService.getPaymentsByMethod(range),
    staleTime: STALE_TIME.MEDIUM,
  });

  const finance = useQuery({
    queryKey: analyticsKeys.financeSummary(key),
    queryFn: () => analyticsService.getFinanceSummary(range),
    staleTime: STALE_TIME.MEDIUM,
    retry: false, // Will 403 for TEACHER role; fail quietly
  });

  return { summary, paymentsByDay, paymentsByMethod, finance };
}

export function useCRMAnalytics() {
  const { range } = useDateRange();
  const key = rangeKey(range);

  const summary = useQuery({
    queryKey: analyticsKeys.summary(key),
    queryFn: () => analyticsService.getDashboardSummary(range),
    staleTime: STALE_TIME.SHORT,
  });

  const leadsByStatus = useQuery({
    queryKey: analyticsKeys.leadsByStatus(key),
    queryFn: () => analyticsService.getLeadsByStatus(range),
    staleTime: STALE_TIME.MEDIUM,
  });

  const leads = useQuery({
    queryKey: analyticsKeys.leads(key),
    queryFn: () => {
      const from = range.from ? range.from.toISOString().slice(0, 10) : undefined;
      const to = range.to ? range.to.toISOString().slice(0, 10) : undefined;
      return leadService.listLeads({ limit: 1000, from, to });
    },
    staleTime: STALE_TIME.MEDIUM,
  });

  return { summary, leadsByStatus, leads };
}

export function useLMSAnalytics() {
  const { range } = useDateRange();
  const key = rangeKey(range);

  const summary = useQuery({
    queryKey: analyticsKeys.summary(key),
    queryFn: () => analyticsService.getDashboardSummary(range),
    staleTime: STALE_TIME.SHORT,
  });

  const invoices = useQuery({
    queryKey: analyticsKeys.invoices(key),
    queryFn: () => analyticsService.listInvoices({ limit: QUERY_LIMITS.INVOICES }),
    staleTime: STALE_TIME.MEDIUM,
    retry: false,
  });

  return { summary, invoices };
}

// ─── AI hooks (rule-based, optionally OpenAI) ────────────────────────
export function usePlatformAI(): {
  data: PlatformAISummary | null;
  isLoading: boolean;
  refetch: () => void;
} {
  const { summary, paymentsByDay, paymentsByMethod, finance } = usePlatformAnalytics();
  const ready = summary.data && paymentsByDay.data && paymentsByMethod.data;
  const data = useMemo<PlatformAISummary | null>(() => {
    if (!ready || !summary.data || !paymentsByDay.data || !paymentsByMethod.data) return null;
    return generatePlatformSummary({
      summary: summary.data,
      paymentsByDay: paymentsByDay.data,
      paymentsByMethod: paymentsByMethod.data,
      finance: finance.data,
    });
  }, [summary.data, paymentsByDay.data, paymentsByMethod.data, finance.data, ready]);

  return {
    data,
    isLoading: summary.isLoading || paymentsByDay.isLoading || paymentsByMethod.isLoading,
    refetch: () => {
      summary.refetch();
      paymentsByDay.refetch();
      paymentsByMethod.refetch();
    },
  };
}

export function useCRMAI(): { data: Insight[]; isLoading: boolean } {
  const { summary } = useCRMAnalytics();
  const data = useMemo<Insight[]>(() => {
    if (!summary.data) return [];
    return generateCRMInsights({ summary: summary.data, leads: [] });
  }, [summary.data]);
  return { data, isLoading: summary.isLoading };
}

export function useLMSAI(): { data: Insight[]; isLoading: boolean } {
  const { summary } = useLMSAnalytics();
  const data = useMemo<Insight[]>(() => {
    if (!summary.data) return [];
    return generateLMSInsights({ summary: summary.data });
  }, [summary.data]);
  return { data, isLoading: summary.isLoading };
}
