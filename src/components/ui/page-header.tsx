'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { TONE_SURFACE, type Tone } from '@/components/ui/tone';

export interface PageHeaderStat {
  /** Short caption under the number. */
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Small caption above the title — e.g. a scope or section name. */
  eyebrow?: string;
  icon?: LucideIcon;
  /** Buttons; use `<Button />` so sizing and spacing stay consistent. */
  actions?: ReactNode;
  stats?: PageHeaderStat[];
  className?: string;
}

/**
 * The single page-title block for every screen.
 *
 * Replaces the hand-rolled headers each page used to carry (dark gradient
 * hero on Students, pale gradient on Groups, plain text on Leads, black
 * panel on Attendance). One structure, one type scale, one tone system.
 */
export function PageHeader({
  title,
  subtitle,
  eyebrow,
  icon: Icon,
  actions,
  stats,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'rounded-card border border-border bg-card px-4 py-4 shadow-card sm:px-6 sm:py-5',
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-control',
                TONE_SURFACE.primary,
              )}
              aria-hidden
            >
              <Icon className="size-5" strokeWidth={2} />
            </span>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-caption font-semibold text-muted-foreground">{eyebrow}</p>
            )}
            <h1 className="text-h1 text-foreground">{title}</h1>
            {subtitle && (
              <p className="mt-1 max-w-2xl text-body-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>

      {stats && stats.length > 0 && (
        <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4 sm:grid-cols-3 lg:flex lg:flex-wrap lg:gap-3">
          {stats.map(({ label, value, icon: StatIcon, tone = 'neutral' }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 rounded-control bg-muted/60 px-3 py-2 lg:min-w-[8.5rem]"
            >
              {StatIcon && (
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-control',
                    TONE_SURFACE[tone],
                  )}
                  aria-hidden
                >
                  <StatIcon className="size-3.5" strokeWidth={2} />
                </span>
              )}
              <div className="min-w-0">
                <dd className="text-h4 tabular-nums text-foreground">{value}</dd>
                <dt className="truncate text-caption font-normal text-muted-foreground">
                  {label}
                </dt>
              </div>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}
