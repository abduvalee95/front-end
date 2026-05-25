'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardSummary, useLeadsByStatus, usePaymentsByMethod, usePaymentsByDay } from '@/hooks/useDashboard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { RecentActivity } from '@/components/dashboard/RecentActivity';

// Lazy load chart components — recharts is heavy (~140KB gzipped)
const RevenueChart = dynamic(
  () => import('@/components/dashboard/RevenueChart').then((m) => m.RevenueChart),
  {
    loading: () => (
      <div className="bg-card rounded-2xl p-6 min-w-0 shadow-sm">
        <Skeleton className="h-[280px] w-full rounded-xl" />
      </div>
    ),
    ssr: false,
  },
);

const LeadsByStatusChart = dynamic(
  () => import('@/components/dashboard/LeadsByStatusChart').then((m) => m.LeadsByStatusChart),
  {
    loading: () => (
      <div className="bg-card rounded-2xl p-6 min-w-0 shadow-sm">
        <Skeleton className="h-[340px] w-full rounded-xl" />
      </div>
    ),
    ssr: false,
  },
);

const PaymentMethodsChart = dynamic(
  () => import('@/components/dashboard/PaymentMethodsChart').then((m) => m.PaymentMethodsChart),
  {
    loading: () => (
      <div className="bg-card rounded-2xl p-6 min-w-0 shadow-sm">
        <Skeleton className="h-[320px] w-full rounded-xl" />
      </div>
    ),
    ssr: false,
  },
);

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: leadsByStatus, isLoading: leadsLoading } = useLeadsByStatus();
  const { data: paymentsByMethod, isLoading: paymentsLoading } = usePaymentsByMethod();
  const { data: paymentsByDay, isLoading: paymentsByDayLoading } = usePaymentsByDay();

  return (
    <div className="w-full h-full space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <StatsGrid summary={summary} isLoading={summaryLoading} />

      <RevenueChart paymentsByDay={paymentsByDay} isLoading={paymentsByDayLoading} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <LeadsByStatusChart leadsByStatus={leadsByStatus} isLoading={leadsLoading} />
            <PaymentMethodsChart paymentsByMethod={paymentsByMethod} isLoading={paymentsLoading} />
          </div>
        </div>

        <div className="space-y-5">
          <RecentActivity summary={summary} isLoading={summaryLoading} />
        </div>
      </div>
    </div>
  );
}
