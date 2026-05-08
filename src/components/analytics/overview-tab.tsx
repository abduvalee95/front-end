'use client';

import { format, parseISO } from 'date-fns';
import {
  Users,
  GraduationCap,
  DollarSign,
  UserPlus,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { usePlatformAnalytics, usePlatformAI } from '@/hooks/useAnalytics';
import { MetricCard, AIBanner, InsightCard, SectionHeader } from './shared';
import { AreaChartWrapper, ChartFrame, DonutChartWrapper } from '@/components/charts/chart-primitives';

function money(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toLocaleString();
}

export function OverviewTab() {
  const { summary, paymentsByDay, paymentsByMethod, finance } = usePlatformAnalytics();
  const ai = usePlatformAI();

  const s = summary.data;
  const payDay = paymentsByDay.data ?? [];
  const payMethod = paymentsByMethod.data ?? [];

  const totalPaymentsInRange = payDay.reduce((a, b) => a + Number(b.totalAmount || 0), 0);
  const paymentsCount = s?.paymentsCount ?? 0;
  const studentsActive = s?.studentsActive ?? 0;
  const leadsNew = s?.leadsNew ?? 0;
  const enrollmentsTotal = s?.enrollmentsTotal ?? 0;
  const coursesActive = s?.coursesActive ?? 0;
  const completion = s?.progressCompletionRate ?? 0;
  const attendance = s?.attendanceRate ?? 0;
  const groupsTotal = s?.groupsTotal ?? 0;

  // Chart data
  const chartData = payDay.map((d) => ({
    x: format(parseISO(d.day), 'MMM d'),
    payments: Number(d.totalAmount || 0),
    count: d.count,
  }));

  const donutData = payMethod
    .filter((p) => Number(p.totalAmount) > 0)
    .map((p) => ({ name: p.method ?? 'Unknown', value: Number(p.totalAmount) }));

  return (
    <div className="space-y-8">
      {/* AI Summary */}
      <AIBanner
        headline={ai.data?.headline ?? 'Analyzing your platform…'}
        body={ai.data?.body ?? 'Collecting metrics to generate insights.'}
        isLoading={ai.isLoading}
        onRefresh={ai.refetch}
      />

      {/* KPI row */}
      <div>
        <SectionHeader title="Platform KPIs" subtitle="Core metrics for the selected period" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            isLoading={summary.isLoading}
            title="Active Students"
            value={studentsActive}
            icon={<Users className="h-5 w-5" />}
            accent="blue"
            hint={`${s?.studentsTotal ?? 0} total / ${s?.studentsInactive ?? 0} inactive`}
          />
          <MetricCard
            isLoading={summary.isLoading}
            title="Enrollments"
            value={enrollmentsTotal}
            icon={<GraduationCap className="h-5 w-5" />}
            accent="violet"
            hint={`Across ${groupsTotal} groups`}
          />
          <MetricCard
            isLoading={paymentsByDay.isLoading}
            title="Revenue (period)"
            value={totalPaymentsInRange}
            format={money}
            icon={<DollarSign className="h-5 w-5" />}
            accent="emerald"
            hint={`${paymentsCount} payments`}
          />
          <MetricCard
            isLoading={summary.isLoading}
            title="New Leads"
            value={leadsNew}
            icon={<UserPlus className="h-5 w-5" />}
            accent="cyan"
            hint={`${s?.leadsConverted ?? 0} converted`}
          />
          <MetricCard
            isLoading={summary.isLoading}
            title="Active Courses"
            value={coursesActive}
            icon={<BookOpen className="h-5 w-5" />}
            accent="amber"
            hint={`${s?.coursesTotal ?? 0} total`}
          />
          <MetricCard
            isLoading={summary.isLoading}
            title="Attendance Rate"
            value={attendance}
            format={(v) => `${Math.round(v)}%`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            accent="teal"
            hint={`${s?.attendancePresent ?? 0} present / ${s?.attendanceAbsent ?? 0} absent`}
          />
          <MetricCard
            isLoading={summary.isLoading}
            title="Completion Rate"
            value={completion}
            format={(v) => `${Math.round(v)}%`}
            icon={<Layers className="h-5 w-5" />}
            accent="pink"
            hint={`${s?.progressCompleted ?? 0} / ${s?.progressTotal ?? 0} lessons`}
          />
          <MetricCard
            isLoading={finance.isLoading}
            title="Profit (period)"
            value={finance.data?.profit ?? 0}
            format={money}
            icon={<AlertTriangle className="h-5 w-5" />}
            accent={finance.data && finance.data.profit < 0 ? 'red' : 'emerald'}
            hint={
              finance.data
                ? `In ${money(finance.data.totalIncome)} · Out ${money(finance.data.totalExpenses)}`
                : 'Requires ADMIN/MANAGER role'
            }
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <ChartFrame
          className="lg:col-span-3"
          title="Revenue over time"
          subtitle="Daily payment totals"
          isLoading={paymentsByDay.isLoading}
          isEmpty={chartData.length === 0}
          height={340}
        >
          <AreaChartWrapper
            data={chartData}
            lines={[{ key: 'payments', label: 'Payments', color: '#10B981' }]}
            yFormatter={money}
          />
        </ChartFrame>

        <ChartFrame
          className="lg:col-span-2"
          title="Payment methods"
          subtitle="Revenue share by channel"
          isLoading={paymentsByMethod.isLoading}
          isEmpty={donutData.length === 0}
          height={340}
        >
          <DonutChartWrapper
            data={donutData}
            centerLabel="Total"
            centerValue={money(donutData.reduce((a, b) => a + b.value, 0))}
          />
        </ChartFrame>
      </div>

      {/* AI trend cards */}
      {ai.data && ai.data.insights.length > 0 && (
        <div>
          <SectionHeader title="AI Insights" subtitle="Generated from live metrics" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ai.data.insights.map((i) => (
              <InsightCard key={i.id} insight={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
