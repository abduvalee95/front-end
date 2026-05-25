'use client';

import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from '@/i18n/index';
import type { StatusCount } from '@/services/dashboard';

const LEAD_STATUS_COLORS: Record<string, string> = {
  NEW: '#3b82f6',
  CONTACTED: '#6366f1',
  CONVERTED: '#10b981',
  LOST: '#ef4444',
};

interface LeadsByStatusChartProps {
  leadsByStatus: StatusCount[] | undefined;
  isLoading: boolean;
}

export function LeadsByStatusChart({ leadsByStatus, isLoading }: LeadsByStatusChartProps) {
  const t = useTranslations('dashboard');

  const pieData = useMemo(() => {
    if (!leadsByStatus) return [];
    return leadsByStatus.map((item) => ({
      name: item.status,
      value: item.count,
      color: LEAD_STATUS_COLORS[item.status] || '#64748b',
    }));
  }, [leadsByStatus]);

  return (
    <div className="bg-card rounded-2xl p-6 min-w-0 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-foreground tracking-tight">{t('leads_by_status')}</h3>
          <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{t('conversion_funnel_overview')}</p>
        </div>
        <div className="flex size-7 items-center justify-center rounded-lg bg-muted">
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
                  contentStyle={{
                    borderRadius: '16px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--popover))',
                    color: 'hsl(var(--popover-foreground))',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-bold text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
          {t('no_lead_data')}
        </div>
      )}
    </div>
  );
}
