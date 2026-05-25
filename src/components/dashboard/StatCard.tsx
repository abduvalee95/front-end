'use client';

import { ArrowUpRight, ArrowDownRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  unit?: string;
  subtitle: string;
  icon: LucideIcon;
  trend: string;
  trendUp: boolean;
  color: string;
}

export function StatCard({ title, value, unit, subtitle, icon: Icon, trend, trendUp, color }: StatCardProps) {
  return (
    <div className="group relative bg-card rounded-2xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-[2.5px] rounded-t-2xl transition-all duration-300 group-hover:h-[3px]"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
      />

      {/* Icon + trend row */}
      <div className="flex items-start justify-between mb-5 pt-1">
        <div
          className="flex size-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundColor: `${color}12`, color }}
        >
          <Icon className="size-4" strokeWidth={2} />
        </div>
        <div
          className={cn(
            'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide',
            trendUp
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
              : 'bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400'
          )}
        >
          {trendUp
            ? <ArrowUpRight className="size-3" strokeWidth={2.5} />
            : <ArrowDownRight className="size-3" strokeWidth={2.5} />}
          {trend}
        </div>
      </div>

      {/* Number */}
      <div className="flex items-baseline gap-1.5 mb-1">
        <span
          className="text-[2.15rem] font-black leading-none tracking-tight text-foreground tabular-nums"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs font-semibold text-muted-foreground mb-0.5">{unit}</span>
        )}
      </div>

      {/* Label + subtitle */}
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1">{title}</p>
      <p className="text-[11px] text-muted-foreground/80 font-medium">{subtitle}</p>
    </div>
  );
}
