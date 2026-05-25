'use client';

import { useMemo } from 'react';
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
import type { PaymentByDay } from '@/services/dashboard';

interface RevenueChartProps {
  paymentsByDay: PaymentByDay[] | undefined;
  isLoading: boolean;
}

export function RevenueChart({ paymentsByDay, isLoading }: RevenueChartProps) {
  const t = useTranslations('dashboard');

  const revenueData = useMemo(() => {
    if (!paymentsByDay) return [];
    return paymentsByDay.map((item) => ({
      day: item.day,
      label: new Date(item.day).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }),
      amount: Number(item.totalAmount) || 0,
      count: item.count,
    }));
  }, [paymentsByDay]);

  const revenueTotal = useMemo(
    () => revenueData.reduce((sum, d) => sum + d.amount, 0),
    [revenueData],
  );

  return (
    <div className="bg-card rounded-2xl p-6 min-w-0 shadow-sm">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground tracking-tight">{t('revenue_trend')}</h3>
          <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{t('revenue_trend_sub')}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            {t('total')}
          </p>
          <p className="text-xl font-bold text-foreground tabular-nums">
            {revenueTotal.toLocaleString()} <span className="text-xs text-muted-foreground">сом</span>
          </p>
        </div>
      </div>
      {isLoading ? (
        <div className="h-[240px] w-full flex items-center justify-center">
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
      ) : revenueData.length > 0 ? (
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                minTickGap={24}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
              />
              <Tooltip
                cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--popover))',
                  color: 'hsl(var(--popover-foreground))',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                }}
                formatter={(value, _name, item) => {
                  const amount = Number(value) || 0;
                  const count = (item?.payload as { count?: number } | undefined)?.count ?? 0;
                  return [`${amount.toLocaleString()} сом · ${count} ${t('transactions')}`, t('amount')];
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#revenueFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
          {t('no_revenue_data')}
        </div>
      )}
    </div>
  );
}
