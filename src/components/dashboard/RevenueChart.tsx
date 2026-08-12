'use client';

import { useMemo } from 'react';
import { eachDayOfInterval, format } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from '@/i18n/index';
import { useChartTheme } from '@/lib/chart-theme';
import type { PaymentByDay } from '@/services/dashboard';

interface RevenueChartProps {
  paymentsByDay: PaymentByDay[] | undefined;
  isLoading: boolean;
  rangeFrom: Date;
  rangeTo: Date;
}

export function RevenueChart({ paymentsByDay, isLoading, rangeFrom, rangeTo }: RevenueChartProps) {
  const t = useTranslations('dashboard');
  const chart = useChartTheme();
  const accent = chart.series[0];

  const revenueData = useMemo(() => {
    const byDay = new Map(
      (paymentsByDay ?? []).map((item) => {
        const key = item.day.slice(0, 10);
        return [key, { amount: Number(item.totalAmount) || 0, count: item.count }];
      }),
    );

    return eachDayOfInterval({ start: rangeFrom, end: rangeTo }).map((date) => {
      const key = format(date, 'yyyy-MM-dd');
      const row = byDay.get(key);
      return {
        day: key,
        label: format(date, 'dd MMM'),
        amount: row?.amount ?? 0,
        count: row?.count ?? 0,
      };
    });
  }, [paymentsByDay, rangeFrom, rangeTo]);

  const revenueTotal = useMemo(
    () => revenueData.reduce((sum, d) => sum + d.amount, 0),
    [revenueData],
  );

  return (
    <div className="min-w-0 rounded-card border border-border bg-card p-6 shadow-card">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="text-h3 text-foreground">{t('revenue_trend')}</h3>
          <p className="mt-0.5 text-caption font-normal text-muted-foreground">{t('revenue_trend_sub')}</p>
        </div>
        <div className="text-right">
          <p className="text-caption text-muted-foreground">{t('total')}</p>
          <p className="text-h2 tabular-nums text-foreground">
            {revenueTotal.toLocaleString()} <span className="text-body-sm text-muted-foreground">сом</span>
          </p>
        </div>
      </div>
      {isLoading ? (
        <div className="h-[240px] w-full flex items-center justify-center">
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
      ) : (
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: chart.axis, fontSize: 11 }}
                minTickGap={24}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: chart.axis, fontSize: 11 }}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
              />
              <Tooltip
                cursor={{ stroke: chart.grid, strokeWidth: 1 }}
                contentStyle={chart.tooltip}
                formatter={(value, _name, item) => {
                  const amount = Number(value) || 0;
                  const count = (item?.payload as { count?: number } | undefined)?.count ?? 0;
                  return [`${amount.toLocaleString()} сом · ${count} ${t('transactions')}`, t('amount')];
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke={accent}
                strokeWidth={2.5}
                fill="url(#revenueFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
