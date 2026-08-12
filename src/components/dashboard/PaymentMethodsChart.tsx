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
import type { PaymentByMethod } from '@/services/dashboard';

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  CASH: '#2dd4bf',
  CARD: '#3b82f6',
  TRANSFER: '#8b5cf6',
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

  const barData = useMemo(() => {
    if (!paymentsByMethod) return [];
    return paymentsByMethod.map((item) => {
      const key = METHOD_LABEL_KEYS[item.method ?? ''];
      return {
        name: key ? tFinance(key) : item.method || 'Unknown',
        value: item.count,
        color: PAYMENT_METHOD_COLORS[item.method || ''] || '#64748b',
      };
    });
  }, [paymentsByMethod, tFinance]);

  return (
    <div className="bg-card rounded-2xl p-6 min-w-0 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-foreground tracking-tight">{t('payment_methods')}</h3>
          <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{t('transaction_breakdown')}</p>
        </div>
        <div className="flex size-7 items-center justify-center rounded-lg bg-muted">
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
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{
                  borderRadius: '16px',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--popover))',
                  color: 'hsl(var(--popover-foreground))',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                }}
              />
              <Bar dataKey="value" radius={[10, 10, 10, 10]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
          {t('no_payment_data')}
        </div>
      )}
    </div>
  );
}
