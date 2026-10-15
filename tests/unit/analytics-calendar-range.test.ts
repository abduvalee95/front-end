import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computeRange } from '@/components/reports/ReportsTabBar';
import { analyticsService } from '@/services/analytics';

const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ api: { get: mocks.get } }));

beforeEach(() => {
  mocks.get.mockReset();
  mocks.get.mockResolvedValue({ data: [] });
});

const endpoints = [
  ['getDashboardSummary', 'proxy/dashboard/summary'],
  ['getLeadsByStatus', 'proxy/dashboard/analytics/leads-by-status'],
  ['getPaymentsByMethod', 'proxy/dashboard/analytics/payments-by-method'],
  ['getPaymentsByDay', 'proxy/dashboard/analytics/payments-by-day'],
  ['getFinanceSummary', 'proxy/finance/summary'],
  ['getFinanceReport', 'proxy/finance/report'],
] as const;

// Run this suite with TZ=UTC, TZ=Asia/Bishkek and TZ=America/Los_Angeles.
// It checks the actual request parameters after report selection and serialization.
describe.each(endpoints)('%s calendar filters', (method, endpoint) => {
  it('keeps the complete selected month in the API request', async () => {
    const range = computeRange('month', 'mtd', '2026-10', '');
    await analyticsService[method](range);
    expect(mocks.get).toHaveBeenCalledWith(endpoint, {
      params: { from: '2026-10-01', to: '2026-10-31' },
    });
  });

  it('keeps the selected Monday-through-Sunday week in the API request', async () => {
    const range = computeRange('week', '7d', '', '2026-10-12');
    await analyticsService[method](range);
    expect(mocks.get).toHaveBeenCalledWith(endpoint, {
      params: { from: '2026-10-12', to: '2026-10-18' },
    });
  });
});

describe('calendar filter edge cases', () => {
  it('keeps a full week across the daylight-saving transition', async () => {
    const range = computeRange('week', '7d', '', '2026-10-26');
    await analyticsService.getFinanceReport(range);
    expect(mocks.get).toHaveBeenCalledWith('proxy/finance/report', {
      params: { from: '2026-10-26', to: '2026-11-01' },
    });
  });

  it('omits missing bounds rather than sending a synthetic date', async () => {
    await analyticsService.getDashboardSummary({ from: null });
    expect(mocks.get).toHaveBeenCalledWith('proxy/dashboard/summary', { params: {} });
  });

  it('supports a single local bound at midnight', async () => {
    await analyticsService.getFinanceSummary({ from: new Date(2026, 9, 1) });
    expect(mocks.get).toHaveBeenCalledWith('proxy/finance/summary', {
      params: { from: '2026-10-01' },
    });
  });
});
