// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DateRangeProvider, useCRMAnalytics, useDateRange } from '@/hooks/useAnalytics';
import { useFinanceSummary } from '@/hooks/useFinance';
import { computeRange } from '@/components/reports/ReportsTabBar';

const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ api: { get: mocks.get } }));
vi.mock('@/store/auth.store', () => ({
  useAuthStore: (selector: (state: { user: { organization_id: string } }) => unknown) =>
    selector({ user: { organization_id: 'org-calendar' } }),
}));

let queryClient: QueryClient;

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <DateRangeProvider>{children}</DateRangeProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  mocks.get.mockReset();
  mocks.get.mockResolvedValue({ data: [] });
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

afterEach(() => {
  cleanup();
  queryClient.clear();
});

describe('CRM analytics calendar filters', () => {
  it.each([
    { mode: 'month' as const, month: '2026-10', week: '', from: '2026-10-01', to: '2026-10-31' },
    { mode: 'week' as const, month: '', week: '2026-10-12', from: '2026-10-12', to: '2026-10-18' },
  ])('passes the selected $mode unchanged to the real lead service', async ({ mode, month, week, from, to }) => {
    const { result } = renderHook(() => ({
      dateRange: useDateRange(),
      queries: useCRMAnalytics(),
    }), { wrapper: Wrapper });

    act(() => result.current.dateRange.setRange(computeRange(mode, 'mtd', month, week)));

    await waitFor(() => expect(result.current.queries.leads.isSuccess).toBe(true));
    expect(mocks.get).toHaveBeenCalledWith('proxy/lead', {
      params: { page: 1, limit: 1000, from, to },
    });
  });
});

describe('finance summary date-only input', () => {
  it('preserves the dates selected in the finance filter through the real analytics service', async () => {
    const { result } = renderHook(() => useFinanceSummary('2026-10-01', '2026-10-31'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.get).toHaveBeenCalledWith('proxy/finance/summary', {
      params: { from: '2026-10-01', to: '2026-10-31' },
    });
  });

  it('allows an unbounded summary', async () => {
    const { result } = renderHook(() => useFinanceSummary(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.get).toHaveBeenCalledWith('proxy/finance/summary', { params: {} });
  });
});
