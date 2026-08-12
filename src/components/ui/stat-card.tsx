'use client';

import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { TONE_FILL, TONE_SURFACE, type Tone } from '@/components/ui/tone';

export interface StatCardProps {
  label: string;
  value: ReactNode;
  /** Small suffix rendered next to the value, e.g. `%` or a currency. */
  unit?: string;
  /** One line of context under the value. */
  hint?: string;
  icon?: LucideIcon;
  tone?: Tone;
  /** Short delta text; `trendUp` picks the direction arrow and tone. */
  trend?: string;
  trendUp?: boolean;
  /** 0–100. Renders a progress bar at the foot of the card. */
  progress?: number;
  isLoading?: boolean;
  className?: string;
}

/**
 * The statistic tile used by Dashboard, Students, Groups, Finance,
 * Attendance and Reports. One radius, one elevation, one type scale;
 * colour only ever arrives through a `tone`.
 */
export function StatCard({
  label,
  value,
  unit,
  hint,
  icon: Icon,
  tone = 'primary',
  trend,
  trendUp,
  progress,
  isLoading = false,
  className,
}: StatCardProps) {
  if (isLoading) {
    return (
      <div className={cn('rounded-card border border-border bg-card p-4 shadow-card', className)}>
        <Skeleton className="size-9 rounded-control" />
        <Skeleton className="mt-4 h-7 w-24" />
        <Skeleton className="mt-2 h-3 w-20" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col rounded-card border border-border bg-card p-4 shadow-card transition-[box-shadow,transform] duration-200 hover:-translate-y-px hover:shadow-card-hover',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        {Icon && (
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-control',
              TONE_SURFACE[tone],
            )}
            aria-hidden
          >
            <Icon className="size-4" strokeWidth={2} />
          </span>
        )}
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-control px-1.5 py-0.5 text-caption',
              trendUp
                ? 'bg-success-muted text-success-emphasis'
                : 'bg-danger-muted text-danger-emphasis',
            )}
          >
            {trendUp ? (
              <ArrowUpRight className="size-3" strokeWidth={2.5} />
            ) : (
              <ArrowDownRight className="size-3" strokeWidth={2.5} />
            )}
            {trend}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-h1 tabular-nums text-foreground">{value}</span>
        {unit && <span className="text-body-sm text-muted-foreground">{unit}</span>}
      </div>

      <p className="mt-1 text-caption text-muted-foreground">{label}</p>
      {hint && <p className="mt-0.5 truncate text-caption font-normal text-muted-foreground">{hint}</p>}

      {progress !== undefined && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-control bg-muted">
          <div
            className={cn('h-full rounded-control transition-[width] duration-700', TONE_FILL[tone])}
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
