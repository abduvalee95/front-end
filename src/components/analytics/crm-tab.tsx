'use client';

import { format, parseISO } from 'date-fns';
import { UserPlus, Users, TrendingUp, UserX, Target, PhoneCall } from 'lucide-react';
import { useCRMAnalytics, useCRMAI } from '@/hooks/useAnalytics';
import type { Lead } from '@/types/analytics';
import { MetricCard, InsightCard, SectionHeader } from './shared';
import { BarChartWrapper, ChartFrame, FunnelChart, LineChartWrapper } from '@/components/charts/chart-primitives';
import { Skeleton } from '@/components/ui/skeleton';
import { seriesColor, useChartTheme } from '@/lib/chart-theme';

export function CRMTab() {
  const chart = useChartTheme();
  const { summary, leadsByStatus, leads } = useCRMAnalytics();
  const { data: insights, isLoading: insightsLoading } = useCRMAI();

  const s = summary.data;
  const statusMap = new Map(leadsByStatus.data?.map((r) => [r.status, r.count]) ?? []);
  const total = s?.leadsTotal ?? 0;
  const conv = s?.leadsConverted ?? 0;
  const convRate = total > 0 ? Math.round((conv / total) * 1000) / 10 : 0;

  // Lead source breakdown (client-side from listLeads)
  const sourceBuckets = new Map<string, number>();
  leads.data?.items.forEach((l: Lead) => {
    const key = (l.source || 'unknown').trim() || 'unknown';
    sourceBuckets.set(key, (sourceBuckets.get(key) || 0) + 1);
  });
  const sourceData = [...sourceBuckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ x: name, value }));

  // Leads by day
  const dayBuckets = new Map<string, number>();
  leads.data?.items.forEach((l: Lead) => {
    const day = l.created_at.slice(0, 10);
    dayBuckets.set(day, (dayBuckets.get(day) || 0) + 1);
  });
  const lineData = [...dayBuckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ x: format(parseISO(day), 'MMM d'), leads: count }));

  // Top admins table
  const adminBuckets = new Map<string, { total: number; converted: number }>();
  leads.data?.items.forEach((l: Lead) => {
    const key = l.admin || 'unassigned';
    const cur = adminBuckets.get(key) ?? { total: 0, converted: 0 };
    cur.total += 1;
    if (l.status === 'CONVERTED') cur.converted += 1;
    adminBuckets.set(key, cur);
  });
  const topAdmins = [...adminBuckets.entries()]
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div>
        <SectionHeader title="CRM KPIs" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard
            isLoading={summary.isLoading}
            title="Total Leads"
            value={total}
            icon={<Users className="h-5 w-5" />}
            accent="violet"
          />
          <MetricCard
            isLoading={summary.isLoading}
            title="New"
            value={s?.leadsNew ?? 0}
            icon={<UserPlus className="h-5 w-5" />}
            accent="blue"
          />
          <MetricCard
            isLoading={summary.isLoading}
            title="Contacted"
            value={s?.leadsContacted ?? 0}
            icon={<PhoneCall className="h-5 w-5" />}
            accent="cyan"
          />
          <MetricCard
            isLoading={summary.isLoading}
            title="Converted"
            value={conv}
            icon={<Target className="h-5 w-5" />}
            accent="emerald"
          />
          <MetricCard
            isLoading={summary.isLoading}
            title="Lost"
            value={s?.leadsLost ?? 0}
            icon={<UserX className="h-5 w-5" />}
            accent="red"
          />
          <MetricCard
            isLoading={summary.isLoading}
            title="Conversion Rate"
            value={convRate}
            format={(v) => `${v.toFixed(1)}%`}
            icon={<TrendingUp className="h-5 w-5" />}
            accent="pink"
          />
        </div>
      </div>

      {/* Funnel + lead-day line */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Lead Funnel</h3>
          {leadsByStatus.isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (
            <FunnelChart
              stages={[
                { label: 'New', value: statusMap.get('NEW') ?? 0, color: seriesColor(chart, 0) },
                { label: 'Contacted', value: statusMap.get('CONTACTED') ?? 0, color: seriesColor(chart, 4) },
                { label: 'Converted', value: statusMap.get('CONVERTED') ?? 0, color: seriesColor(chart, 1) },
                { label: 'Lost', value: statusMap.get('LOST') ?? 0, color: seriesColor(chart, 3) },
              ]}
            />
          )}
        </div>

        <ChartFrame
          title="Leads by day"
          subtitle="New lead creation trend"
          isLoading={leads.isLoading}
          isEmpty={lineData.length === 0}
          height={280}
        >
          <LineChartWrapper
            data={lineData}
            lines={[{ key: 'leads', label: 'Leads', color: seriesColor(chart, 0) }]}
          />
        </ChartFrame>
      </div>

      {/* Lead source + AI insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartFrame
          title="Lead sources"
          subtitle="Top acquisition channels"
          isLoading={leads.isLoading}
          isEmpty={sourceData.length === 0}
          height={320}
        >
          <BarChartWrapper data={sourceData} color={seriesColor(chart, 0)} horizontal />
        </ChartFrame>

        <div>
          <SectionHeader title="AI CRM Insights" />
          {insightsLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          ) : insights.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-6 text-body text-muted-foreground">
              No insights yet — add more leads to see patterns.
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((i) => (
                <InsightCard key={i.id} insight={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top admins */}
      <div>
        <SectionHeader title="Top Admins" subtitle="Lead handlers ranked by volume" />
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-body">
            <thead className="bg-muted/50 text-caption uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Admin</th>
                <th className="text-right font-semibold px-4 py-3">Leads</th>
                <th className="text-right font-semibold px-4 py-3">Converted</th>
                <th className="text-right font-semibold px-4 py-3">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {leads.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-12 ml-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-12 ml-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : topAdmins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No lead data
                  </td>
                </tr>
              ) : (
                topAdmins.map(([name, data]) => (
                  <tr key={name} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{name}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{data.total}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{data.converted}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {data.total > 0
                        ? `${Math.round((data.converted / data.total) * 100)}%`
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
