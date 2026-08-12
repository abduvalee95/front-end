'use client';

import { useTheme } from 'next-themes';

/**
 * Chart palette.
 *
 * Charts are the one place the product needs several distinguishable
 * colours at once, so the series ramp is derived from the design tokens
 * rather than invented per chart: the accent first, then the four semantic
 * tones, then two accent-family steps. Every value here is the resolved hex
 * of a token in `globals.css` — recharts writes `fill`/`stroke` as SVG
 * presentation attributes, which cannot resolve `var()`.
 */
const SERIES_LIGHT = [
  '#0C6F8A', // --primary
  '#15803D', // --success
  '#A15C07', // --warning
  '#C62828', // --danger
  '#1D4ED8', // --info
  '#566076', // --muted-foreground
  '#0A5568', // --primary-emphasis
] as const;

const SERIES_DARK = [
  '#4FD1E8', // --primary (dark)
  '#6EE7A8', // --success (dark)
  '#FBBF24', // --warning (dark)
  '#FCA5A5', // --danger (dark)
  '#93C5FD', // --info (dark)
  '#9BA8BE', // --muted-foreground (dark)
  '#7FE0F1', // --primary-emphasis (dark)
] as const;

export interface ChartTheme {
  /** Categorical series colours, in order. */
  series: readonly string[];
  /** Cartesian grid stroke. */
  grid: string;
  /** Axis tick / label colour. */
  axis: string;
  /** Style object for `<Tooltip contentStyle>`. */
  tooltip: React.CSSProperties;
  isDark: boolean;
}

const THEME_LIGHT: ChartTheme = {
  series: SERIES_LIGHT,
  grid: '#DFE5EC',
  axis: '#566076',
  tooltip: {
    borderRadius: 'var(--radius-card)',
    border: '1px solid #DFE5EC',
    background: '#FFFFFF',
    color: '#0F1729',
    boxShadow: '0 10px 24px -6px rgba(15,23,41,0.12)',
    fontSize: 12,
  },
  isDark: false,
};

const THEME_DARK: ChartTheme = {
  series: SERIES_DARK,
  grid: '#263149',
  axis: '#9BA8BE',
  tooltip: {
    borderRadius: 'var(--radius-card)',
    border: '1px solid #263149',
    background: '#141C2C',
    color: '#E9EEF6',
    boxShadow: '0 10px 24px -6px rgba(0,0,0,0.5)',
    fontSize: 12,
  },
  isDark: true,
};

export function useChartTheme(): ChartTheme {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark' ? THEME_DARK : THEME_LIGHT;
}

/** Stable colour for a named series (lead status, payment method, …). */
export function seriesColor(theme: ChartTheme, index: number): string {
  return theme.series[index % theme.series.length];
}

export { SERIES_LIGHT, SERIES_DARK };
