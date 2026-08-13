'use client';

import { BarChart3, Wallet, GraduationCap, Target, CalendarDays, CalendarRange } from 'lucide-react';
import { format, startOfWeek, endOfWeek, subWeeks, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n/index';
import { PageHeader } from '@/components/ui/page-header';

export type ReportsTab = 'finance' | 'students' | 'leads';
export type Preset = '7d' | '30d' | '90d' | 'mtd';
export type FilterMode = 'preset' | 'month' | 'week';

export interface DateRange { from: Date; to: Date }

/** Compute date range from filter state */
export function computeRange(
  mode: FilterMode,
  preset: Preset,
  selectedMonth: string,   // 'YYYY-MM'
  selectedWeek: string,    // 'YYYY-MM-DD' (Monday of that week)
): DateRange {
  const now = new Date();
  const to = endOfMonth(now); // generous upper bound

  if (mode === 'month' && selectedMonth) {
    const d = new Date(selectedMonth + '-01');
    return { from: startOfMonth(d), to: endOfMonth(d) };
  }
  if (mode === 'week' && selectedWeek) {
    const d = new Date(selectedWeek);
    return {
      from: startOfWeek(d, { weekStartsOn: 1 }),
      to: endOfWeek(d, { weekStartsOn: 1 }),
    };
  }
  // preset fallback
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  switch (preset) {
    case '7d':  return { from: subWeeks(today, 1), to: end };
    case '30d': return { from: subMonths(today, 1), to: end };
    case '90d': return { from: subMonths(today, 3), to: end };
    case 'mtd': return { from: startOfMonth(today), to: end };
  }
}

/** Last N months as options */
function buildMonthOptions(n = 12) {
  return Array.from({ length: n }, (_, i) => {
    const d = subMonths(new Date(), i);
    return {
      value: format(d, 'yyyy-MM'),
      label: format(d, 'LLLL yyyy', { locale: ru }),
    };
  });
}

/** Last N weeks as options */
function buildWeekOptions(n = 12) {
  return Array.from({ length: n }, (_, i) => {
    const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    return {
      value: format(weekStart, 'yyyy-MM-dd'),
      label: `${format(weekStart, 'dd MMM', { locale: ru })} — ${format(weekEnd, 'dd MMM', { locale: ru })}`,
    };
  });
}

interface Props {
  activeTab: ReportsTab;
  onTabChange: (tab: ReportsTab) => void;
  filterMode: FilterMode;
  onFilterModeChange: (mode: FilterMode) => void;
  preset: Preset;
  onPresetChange: (preset: Preset) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  selectedWeek: string;
  onWeekChange: (week: string) => void;
  dateFrom: Date;
  dateTo: Date;
}

export function ReportsTabBar({
  activeTab, onTabChange,
  filterMode, onFilterModeChange,
  preset, onPresetChange,
  selectedMonth, onMonthChange,
  selectedWeek, onWeekChange,
  dateFrom, dateTo,
}: Props) {
  const t = useTranslations('reports');

  const PRESETS: { key: Preset; label: string }[] = [
    { key: '7d',  label: t('preset_7d') },
    { key: '30d', label: t('preset_30d') },
    { key: '90d', label: t('preset_90d') },
    { key: 'mtd', label: t('preset_mtd') },
  ];

  const TABS: { value: ReportsTab; icon: React.ElementType; label: string }[] = [
    { value: 'finance',  icon: Wallet,        label: t('tab_finance') },
    { value: 'students', icon: GraduationCap, label: t('tab_students') },
    { value: 'leads',    icon: Target,        label: t('tab_leads') },
  ];

  const monthOptions = buildMonthOptions();
  const weekOptions  = buildWeekOptions();

  return (
    <div className="sticky top-[72px] z-30 -mx-4 border-b border-border bg-background/95 px-4 pt-5 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <PageHeader
        className="mb-4"
        icon={BarChart3}
        title={t('title')}
        subtitle={`${format(dateFrom, 'dd MMM yyyy', { locale: ru })} — ${format(dateTo, 'dd MMM yyyy', { locale: ru })}`}
        actions={
          <>
          {/* Quick presets */}
          <div className="flex items-center gap-0.5 rounded-control border border-border bg-muted p-1">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => { onPresetChange(p.key); onFilterModeChange('preset'); }}
                className={cn(
                  'cursor-pointer rounded-control px-3 py-1.5 text-caption transition-colors duration-150',
                  filterMode === 'preset' && preset === p.key
                    ? 'bg-card text-foreground shadow-card'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="hidden h-5 w-px bg-border sm:block" />

          {/* Month picker */}
          <div className={cn(
            'flex cursor-pointer items-center gap-1.5 rounded-control border px-2.5 py-1.5 transition-colors duration-150',
            filterMode === 'month'
              ? 'border-primary/40 bg-primary-muted text-primary-emphasis dark:text-primary'
              : 'border-border bg-muted text-muted-foreground hover:text-foreground',
          )}>
            <CalendarDays className="size-3.5 shrink-0 pointer-events-none" aria-hidden="true" />
            <select
              value={filterMode === 'month' ? selectedMonth : ''}
              onChange={(e) => {
                if (e.target.value) {
                  onMonthChange(e.target.value);
                  onFilterModeChange('month');
                }
              }}
              className="max-w-[130px] cursor-pointer border-0 bg-transparent text-caption outline-none"
              aria-label={t('filter_by_month')}
            >
              <option value="">{t('filter_by_month')}</option>
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Week picker */}
          <div className={cn(
            'flex cursor-pointer items-center gap-1.5 rounded-control border px-2.5 py-1.5 transition-colors duration-150',
            filterMode === 'week'
              ? 'border-primary/40 bg-primary-muted text-primary-emphasis dark:text-primary'
              : 'border-border bg-muted text-muted-foreground hover:text-foreground',
          )}>
            <CalendarRange className="size-3.5 shrink-0 pointer-events-none" aria-hidden="true" />
            <select
              value={filterMode === 'week' ? selectedWeek : ''}
              onChange={(e) => {
                if (e.target.value) {
                  onWeekChange(e.target.value);
                  onFilterModeChange('week');
                }
              }}
              className="max-w-[160px] cursor-pointer border-0 bg-transparent text-caption outline-none"
              aria-label={t('filter_by_week')}
            >
              <option value="">{t('filter_by_week')}</option>
              {weekOptions.map((w) => (
                <option key={w.value} value={w.value}>{w.label}</option>
              ))}
            </select>
          </div>
          </>
        }
      />

      {/* Underline tabs */}
      <div className="flex gap-0" role="tablist">
        {TABS.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            role="tab"
            aria-selected={activeTab === value}
            onClick={() => onTabChange(value)}
            className={cn(
              'relative flex h-11 cursor-pointer items-center gap-2 px-4 text-body-sm font-medium transition-colors',
              'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t-full after:bg-primary after:transition-transform after:duration-200',
              activeTab === value
                ? 'text-primary after:scale-x-100'
                : 'text-muted-foreground hover:text-foreground after:scale-x-0',
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
