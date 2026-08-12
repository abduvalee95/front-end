'use client';

import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from '@/i18n/index';
import { seriesColor, useChartTheme } from '@/lib/chart-theme';
import type { PaymentByMethod } from '@/services/dashboard';

/** Position in the shared chart ramp. */
const PAYMENT_METHOD_SERIES: Record<string, number> = {
  CASH: 1,
  CARD: 0,
  TRANSFER: 5,
};

interface PaymentMethodsChartProps {
  paymentsByMethod: PaymentByMethod[] | undefined;
  isLoading: boolean;
}

const METHOD_LABEL_KEYS: Record<string, string> = {
  CASH: 'method_cash',
  CARD: 'method_card',
  TRANSFER: 'method_transfer',
};

export function PaymentMethodsChart({ paymentsByMethod, isLoading }: PaymentMethodsChartProps) {
  const t = useTranslations('dashboard');
  const tFinance = useTranslations('finance');
  const chart = useChartTheme();

  const barData = useMemo(() => {
    if (!paymentsByMethod) return [];
    return paymentsByMethod.map((item) => {
      const key = METHOD_LABEL_KEYS[item.method ?? ''];
      return {
        name: key ? tFinance(key) : item.method || 'Unknown',
        value: item.count,
        color: seriesColor(chart, PAYMENT_METHOD_SERIES[item.method ?? ''] ?? 5),
      };
    });
  }, [paymentsByMethod, tFinance, chart]);

  return (
    <div className="min-w-0 rounded-card border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-h3 text-foreground">{t('payment_methods')}</h3>
          <p className="mt-0.5 text-caption font-normal text-muted-foreground">{t('transaction_breakdown')}</p>
        </div>
        <div className="flex size-7 items-center justify-center rounded-control bg-muted">
          <Clock className="size-3.5 text-muted-foreground" strokeWidth={2} />
        </div>
      </div>
      {isLoading ? (
        <div className="h-[280px] w-full mt-4 min-h-[280px] flex items-center justify-center">
          <div className="space-y-4 w-full">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      ) : barData.length > 0 ? (
        <div className="h-[280px] w-full mt-4 min-h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={45}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: chart.axis, fontSize: 12, fontWeight: 500 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: chart.axis, fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: chart.grid, fillOpacity: 0.4 }}
                contentStyle={chart.tooltip}
              />
              <Bar dataKey="value" radius={[8, 8, 8, 8]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-[280px] items-center justify-center text-body-sm text-muted-foreground">
          {t('no_payment_data')}
        </div>
      )}
    </div>
  );
}
