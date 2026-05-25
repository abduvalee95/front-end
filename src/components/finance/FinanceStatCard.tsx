'use client';

import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatAmount, STAT_CONFIG, type StatType } from './utils';

interface FinanceStatCardProps {
  label: string;
  value: number | undefined;
  icon: ReactNode;
  type: StatType;
  sub?: string;
  barRatio?: number;
}

export function FinanceStatCard({ label, value, icon, type, sub, barRatio }: FinanceStatCardProps) {
  const c = STAT_CONFIG[type];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-px">
      <div className={`absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r ${c.grad}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground/60">{label}</p>
          <div className="mt-2.5">
            {value === undefined ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <p className={cn('text-[21px] font-black tabular-nums tracking-tight leading-none', c.amount)}>
                {formatAmount(value)}
              </p>
            )}
          </div>
          {sub && <p className="mt-1.5 text-[11px] font-medium text-muted-foreground/55">{sub}</p>}
        </div>
        <div className={cn('size-10 shrink-0 rounded-xl flex items-center justify-center', c.iconBg)}>{icon}</div>
      </div>
      {barRatio !== undefined && (
        <div className="mt-4 space-y-1">
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-700', c.bar)}
              style={{ width: `${Math.min(barRatio, 100)}%` }}
            />
          </div>
          <p className="text-[9.5px] font-semibold text-muted-foreground/40 tabular-nums">{barRatio}% share</p>
        </div>
      )}
    </div>
  );
}
