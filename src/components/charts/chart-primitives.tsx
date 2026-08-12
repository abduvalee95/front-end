/**
 * Shared chart primitives using Recharts.
 * All charts: responsive container, skeleton, empty state, consistent theme.
 */

'use client';

import { ReactNode } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { SERIES_LIGHT } from '@/lib/chart-theme';

/** @deprecated Use `useChartTheme().series` — kept for non-reactive callers. */
export const CHART_COLORS = SERIES_LIGHT;

interface ChartFrameProps {
  title: string;
  subtitle?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyText?: string;
  height?: number;
  className?: string;
  children: ReactNode;
  action?: ReactNode;
}

export function ChartFrame({
  title,
  subtitle,
  isLoading,
  isEmpty,
  emptyText = 'No data for this range',
  height = 320,
  className,
  children,
  action,
}: ChartFrameProps) {
  return (
    <div className={cn('bg-card border border-border rounded-2xl p-6 flex flex-col', className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div style={{ height }} className="flex-1 relative">
        {isLoading ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : isEmpty ? (
          <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ── Line chart ─────────────────────────────────────────────────────
export interface LineDatum {
  x: string;
  [key: string]: string | number;
}

interface LineChartWrapperProps {
  data: LineDatum[];
  lines: { key: string; label: string; color?: string }[];
  yFormatter?: (v: number) => string;
}

export function LineChartWrapper({ data, lines, yFormatter }: LineChartWrapperProps) {
  return (
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
      <XAxis dataKey="x" stroke="hsl(var(--muted-foreground))" fontSize={11} />
      <YAxis
        stroke="hsl(var(--muted-foreground))"
        fontSize={11}
        tickFormatter={yFormatter}
        width={60}
      />
      <Tooltip
        cursor={{ fill: 'hsl(var(--muted))' }}
        contentStyle={{
          background: 'hsl(var(--popover))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 8,
          fontSize: 12,
          color: 'hsl(var(--popover-foreground))',
        }}
        formatter={(v: unknown) => (yFormatter && typeof v === 'number' ? yFormatter(v) : String(v))}
      />
      <Legend wrapperStyle={{ fontSize: 12 }} />
      {lines.map((l, i) => (
        <Line
          key={l.key}
          type="monotone"
          dataKey={l.key}
          name={l.label}
          stroke={l.color ?? CHART_COLORS[i % CHART_COLORS.length]}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      ))}
    </LineChart>
  );
}

// ── Area chart ─────────────────────────────────────────────────────
export function AreaChartWrapper({ data, lines, yFormatter }: LineChartWrapperProps) {
  return (
    <AreaChart data={data}>
      <defs>
        {lines.map((l, i) => {
          const color = l.color ?? CHART_COLORS[i % CHART_COLORS.length];
          return (
            <linearGradient key={l.key} id={`grad-${l.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          );
        })}
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
      <XAxis dataKey="x" stroke="hsl(var(--muted-foreground))" fontSize={11} />
      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={yFormatter} width={60} />
      <Tooltip
        cursor={{ fill: 'hsl(var(--muted))' }}
        contentStyle={{
          background: 'hsl(var(--popover))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 8,
          fontSize: 12,
          color: 'hsl(var(--popover-foreground))',
        }}
        formatter={(v: unknown) => (yFormatter && typeof v === 'number' ? yFormatter(v) : String(v))}
      />
      <Legend wrapperStyle={{ fontSize: 12 }} />
      {lines.map((l, i) => {
        const color = l.color ?? CHART_COLORS[i % CHART_COLORS.length];
        return (
          <Area
            key={l.key}
            type="monotone"
            dataKey={l.key}
            name={l.label}
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${l.key})`}
          />
        );
      })}
    </AreaChart>
  );
}

// ── Bar chart ──────────────────────────────────────────────────────
interface BarDatum {
  x: string;
  value: number;
}

export function BarChartWrapper({
  data,
  color,
  yFormatter,
  horizontal,
}: {
  data: BarDatum[];
  color?: string;
  yFormatter?: (v: number) => string;
  horizontal?: boolean;
}) {
  return (
    <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'}>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
      {horizontal ? (
        <>
          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={yFormatter} />
          <YAxis type="category" dataKey="x" stroke="hsl(var(--muted-foreground))" fontSize={11} width={110} />
        </>
      ) : (
        <>
          <XAxis dataKey="x" stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={yFormatter} width={60} />
        </>
      )}
      <Tooltip
        cursor={{ fill: 'hsl(var(--muted))' }}
        contentStyle={{
          background: 'hsl(var(--popover))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 8,
          fontSize: 12,
          color: 'hsl(var(--popover-foreground))',
        }}
        formatter={(v: unknown) => (yFormatter && typeof v === 'number' ? yFormatter(v) : String(v))}
      />
      <Bar dataKey="value" fill={color ?? CHART_COLORS[0]} radius={[6, 6, 0, 0]} />
    </BarChart>
  );
}

// ── Donut chart ───────────────────────────────────────────────────
interface DonutDatum {
  name: string;
  value: number;
}

export function DonutChartWrapper({
  data,
  centerLabel,
  centerValue,
}: {
  data: DonutDatum[];
  centerLabel?: string;
  centerValue?: string;
}) {
  return (
    <PieChart>
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        innerRadius="55%"
        outerRadius="85%"
        paddingAngle={2}
      >
        {data.map((_, i) => (
          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
        ))}
      </Pie>
      <Tooltip
        contentStyle={{
          background: 'hsl(var(--popover))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 8,
          fontSize: 12,
          color: 'hsl(var(--popover-foreground))',
        }}
      />
      <Legend
        verticalAlign="bottom"
        iconType="circle"
        wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
      />
      {centerValue && (
        <text
          x="50%"
          y="46%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground"
          style={{ fontSize: 22, fontWeight: 700 }}
        >
          {centerValue}
        </text>
      )}
      {centerLabel && (
        <text
          x="50%"
          y="55%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted-foreground"
          style={{ fontSize: 11 }}
        >
          {centerLabel}
        </text>
      )}
    </PieChart>
  );
}

// ── Simple funnel (bar rows with percentages) ───────────────────────
interface FunnelStage {
  label: string;
  value: number;
  color?: string;
}

export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(...stages.map((s) => s.value), 1);
  return (
    <div className="space-y-3">
      {stages.map((s, i) => {
        const pct = Math.round((s.value / max) * 100);
        const prev = i > 0 ? stages[i - 1].value : 0;
        const drop = i > 0 && prev > 0 ? Math.round((s.value / prev) * 100) : 100;
        return (
          <div key={s.label}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-sm font-medium">{s.label}</span>
              <span className="text-sm tabular-nums text-muted-foreground">
                {s.value.toLocaleString()}
                {i > 0 && <span className="ml-2 text-xs">({drop}%)</span>}
              </span>
            </div>
            <div className="h-10 rounded-lg bg-muted/50 overflow-hidden">
              <div
                className="h-full rounded-lg transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: s.color ?? CHART_COLORS[i % CHART_COLORS.length],
                  opacity: 0.85,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
