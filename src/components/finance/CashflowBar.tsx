'use client';

import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatAmount } from './utils';

interface CashflowBarProps {
  income: number;
  expenses: number;
}

export function CashflowBar({ income, expenses }: CashflowBarProps) {
  const total = income + expenses;
  if (total === 0) return null;
  const incomeRatio = Math.round((income / total) * 100);
  const expenseRatio = 100 - incomeRatio;
  const net = income - expenses;
  const isPositive = net >= 0;

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground/60">Cash Flow</p>
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-[11px] font-black px-2 py-0.5 rounded-full',
              isPositive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600',
            )}
          >
            {isPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {formatAmount(Math.abs(net))}
          </span>
        </div>
        <span className="text-[11px] font-bold text-muted-foreground/50 tabular-nums">
          {incomeRatio}% <span className="text-muted-foreground/30">·</span> {expenseRatio}%
        </span>
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full gap-px bg-muted">
        <div className="h-full rounded-l-full bg-emerald-500 transition-all duration-700" style={{ width: `${incomeRatio}%` }} />
        <div className="h-full rounded-r-full bg-rose-500 transition-all duration-700" style={{ width: `${expenseRatio}%` }} />
      </div>
      <div className="mt-2 flex items-center gap-5">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/60">
          <span className="size-2 rounded-full bg-emerald-500" />
          Income · {incomeRatio}%
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/60">
          <span className="size-2 rounded-full bg-rose-500" />
          Expenses · {expenseRatio}%
        </span>
      </div>
    </div>
  );
}
