'use client';

import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from '@/i18n/index';
import { seriesColor, useChartTheme } from '@/lib/chart-theme';
import type { StatusCount } from '@/services/dashboard';

/** Position in the shared chart ramp, so statuses read the same everywhere. */
const LEAD_STATUS_SERIES: Record<string, number> = {
  NEW: 0,
  CONTACTED: 4,
  CONVERTED: 1,
  LOST: 3,
};

interface LeadsByStatusChartProps {
  leadsByStatus: StatusCount[] | undefined;
  isLoading: boolean;
}

export function LeadsByStatusChart({ leadsByStatus, isLoading }: LeadsByStatusChartProps) {
  const t = useTranslations('dashboard');
  const chart = useChartTheme();

  const pieData = useMemo(() => {
    if (!leadsByStatus) return [];
    return leadsByStatus.map((item) => ({
      name: item.status,
      value: item.count,
      color: seriesColor(chart, LEAD_STATUS_SERIES[item.status] ?? 5),
    }));
  }, [leadsByStatus, chart]);

  return (
    <div className="min-w-0 rounded-card border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-h3 text-foreground">{t('leads_by_status')}</h3>
          <p className="mt-0.5 text-caption font-normal text-muted-foreground">{t('conversion_funnel_overview')}</p>
        </div>
        <div className="flex size-7 items-center justify-center rounded-control bg-muted">
          <TrendingUp className="size-3.5 text-muted-foreground" strokeWidth={2} />
        </div>
      </div>
      {isLoading ? (
        <div className="h-[300px] w-full min-h-[300px] flex items-center justify-center">
          <Skeleton className="h-48 w-48 rounded-full" />
        </div>
      ) : pieData.length > 0 ? (
        <>
          <div className="h-[300px] w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={chart.tooltip}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-caption text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex h-[300px] items-center justify-center text-body-sm text-muted-foreground">
          {t('no_lead_data')}
        </div>
      )}
    </div>
  );
}
