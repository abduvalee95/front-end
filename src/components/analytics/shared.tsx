/**
 * Shared analytics UI primitives.
 */

'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Insight, InsightTone } from '@/types/analytics';

// ── Animated counter ─────────────────────────────────────────────
export function AnimatedNumber({
  value,
  format,
  duration = 1200,
}: {
  value: number;
  format?: (v: number) => string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const start = useRef<number | null>(null);
  const from = useRef(0);

  useEffect(() => {
    from.current = display;
    start.current = null;
    let raf = 0;
    const step = (ts: number) => {
      if (start.current === null) start.current = ts;
      const elapsed = ts - start.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from.current + (value - from.current) * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <>{format ? format(display) : Math.round(display).toLocaleString()}</>;
}

// ── KPI card ─────────────────────────────────────────────────────
export interface MetricCardProps {
  title: string;
  value: number;
  format?: (v: number) => string;
  icon: ReactNode;
  accent?: 'blue' | 'violet' | 'emerald' | 'cyan' | 'amber' | 'pink' | 'red' | 'teal';
  trend?: number; // % change
  hint?: string;
  isLoading?: boolean;
}

const ACCENTS: Record<NonNullable<MetricCardProps['accent']>, string> = {
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  pink: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  red: 'bg-red-500/10 text-red-600 dark:text-red-400',
  teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
};

export function MetricCard({
  title,
  value,
  format,
  icon,
  accent = 'blue',
  trend,
  hint,
  isLoading,
}: MetricCardProps) {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 h-[140px] animate-pulse">
        <div className="h-10 w-10 rounded-xl bg-muted/60" />
        <div className="h-7 w-24 bg-muted/60 rounded mt-4" />
        <div className="h-3 w-32 bg-muted/40 rounded mt-2" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            'h-10 w-10 rounded-xl flex items-center justify-center',
            ACCENTS[accent],
          )}
        >
          {icon}
        </div>
        {trend !== undefined && <TrendBadge delta={trend} />}
      </div>
      <div>
        <div className="text-2xl font-bold tabular-nums">
          <AnimatedNumber value={value} format={format} />
        </div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{title}</div>
      </div>
      {hint && <p className="text-xs text-muted-foreground line-clamp-2">{hint}</p>}
    </div>
  );
}

// ── Trend badge ──────────────────────────────────────────────────
export function TrendBadge({ delta }: { delta: number }) {
  if (!Number.isFinite(delta)) return null;
  const up = delta > 0.5;
  const down = delta < -0.5;
  const Icon = up ? TrendingUp : down ? TrendingDown : Minus;
  const color = up
    ? 'text-emerald-600 bg-emerald-500/10'
    : down
    ? 'text-red-600 bg-red-500/10'
    : 'text-muted-foreground bg-muted';
  return (
    <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold', color)}>
      <Icon className="h-3 w-3" />
      <span>{Math.abs(delta).toFixed(1)}%</span>
    </div>
  );
}

// ── Insight card ─────────────────────────────────────────────────
const TONE_STYLE: Record<InsightTone, { bar: string; icon: string; label: string }> = {
  positive: { bar: 'bg-emerald-500', icon: 'text-emerald-500', label: 'Positive' },
  warning: { bar: 'bg-amber-500', icon: 'text-amber-500', label: 'Warning' },
  urgent: { bar: 'bg-red-500', icon: 'text-red-500', label: 'Urgent' },
  info: { bar: 'bg-blue-500', icon: 'text-blue-500', label: 'Info' },
  opportunity: { bar: 'bg-violet-500', icon: 'text-violet-500', label: 'Opportunity' },
};

export function InsightCard({ insight }: { insight: Insight }) {
  const style = TONE_STYLE[insight.tone];
  return (
    <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden flex flex-col gap-2">
      <div className={cn('absolute left-0 top-0 bottom-0 w-1', style.bar)} />
      <div className="flex items-center gap-2">
        <Sparkles className={cn('h-4 w-4', style.icon)} />
        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
          {style.label}
        </span>
      </div>
      <h4 className="font-semibold text-foreground">{insight.title}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">{insight.body}</p>
    </div>
  );
}

// ── AI banner ────────────────────────────────────────────────────
export function AIBanner({
  headline,
  body,
  onRefresh,
  isLoading,
}: {
  headline: string;
  body: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-blue-600 via-violet-600 to-purple-700 text-white shadow-xl">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-cyan-300 blur-3xl" />
      </div>
      <div className="relative flex items-start gap-4">
        <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 border border-white/20">
          <Sparkles className="h-6 w-6 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] bg-white/15 px-2 py-0.5 rounded-full">
              AI Summary
            </span>
          </div>
          <h2 className="text-xl font-bold mb-2">{headline}</h2>
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-3 w-3/4 bg-white/20 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-white/20 rounded animate-pulse" />
            </div>
          ) : (
            <p className="text-sm opacity-90 leading-relaxed">{body}</p>
          )}
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur hover:bg-white/25 transition-colors text-xs font-medium border border-white/20"
          >
            Refresh
          </button>
        )}
      </div>
    </div>
  );
}

// ── Section header ──────────────────────────────────────────────
export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}
