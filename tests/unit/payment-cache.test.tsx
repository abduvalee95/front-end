// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQueries } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCreatePayment, useDeletePayment } from '@/hooks/useFinance';
import { queryKeys } from '@/lib/api/query-keys';

const services = vi.hoisted(() => ({ create: vi.fn(), remove: vi.fn() }));
vi.mock('@/services/finance', () => ({ paymentService: services, expenseService: {} }));
vi.mock('@/services/analytics', () => ({ analyticsService: {} }));
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));
vi.mock('@/store/auth.store', () => ({
  useAuthStore: (selector: (state: { user: { organization_id: string } }) => unknown) =>
    selector({ user: { organization_id: 'org-a' } }),
}));

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

const affectedViews = [
  queryKeys.finance.payments('org-a', { from: '2026-10-01', limit: 1000 }),
  [...queryKeys.students.all('org-a'), 'student-detail', 'student-1'],
  queryKeys.dashboard.summary('org-a'),
  ['analytics', 'finance-summary', '2026-10'],
  ['reports', 'summary', '2026-10'],
];

function setup(initialPaid: number, deleting: boolean) {
  let backendPaid = initialPaid;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  services.create.mockImplementation(async () => { backendPaid += 150; return { id: 'payment-1' }; });
  services.remove.mockImplementation(async () => { backendPaid -= 150; });
  client.setQueryData(queryKeys.finance.payments('org-b'), 999);
  client.setQueryData(queryKeys.students.detail('org-b', 'student-2'), 999);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const hook = renderHook(() => ({
    create: useCreatePayment(),
    remove: useDeletePayment(),
    views: useQueries({ queries: affectedViews.map((queryKey) => ({
      queryKey,
      queryFn: async () => backendPaid,
      staleTime: Infinity,
    })) }),
  }), { wrapper });
  const mutate = () => deleting
    ? hook.result.current.remove.mutateAsync('payment-1')
    : hook.result.current.create.mutateAsync({ student_id: 'student-1', amount: 150, method: 'CASH' });
  return { ...hook, client, mutate };
}

describe('payment changes across cached views', () => {
  it.each([
    { deleting: false, initial: 0, expected: 150 },
    { deleting: true, initial: 150, expected: 0 },
  ])('updates student, dashboard and reports after deleting=$deleting', async ({ deleting, initial, expected }) => {
    const { result, client, mutate } = setup(initial, deleting);
    await waitFor(() => expect(result.current.views.map((view) => view.data)).toEqual(affectedViews.map(() => initial)));
    await act(async () => { await mutate(); });
    await waitFor(() => expect(result.current.views.map((view) => view.data)).toEqual(affectedViews.map(() => expected)));
    expect(client.getQueryState(queryKeys.finance.payments('org-b'))?.isInvalidated).toBe(false);
    expect(client.getQueryState(queryKeys.students.detail('org-b', 'student-2'))?.isInvalidated).toBe(false);
    client.clear();
  });

  it('preserves current values when the payment write fails', async () => {
    const { result, client, mutate } = setup(50, false);
    await waitFor(() => expect(result.current.views.every((view) => view.data === 50)).toBe(true));
    services.create.mockRejectedValueOnce(new Error('Payment rejected'));
    await act(async () => { await expect(mutate()).rejects.toThrow('Payment rejected'); });
    expect(result.current.views.map((view) => view.data)).toEqual(affectedViews.map(() => 50));
    expect(affectedViews.map((key) => client.getQueryState(key)?.isInvalidated)).toEqual(affectedViews.map(() => false));
    client.clear();
  });
});
