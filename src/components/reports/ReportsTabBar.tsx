'use client';

import { Wallet, GraduationCap, Target } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n/index';

export type ReportsTab = 'finance' | 'students' | 'leads';
export type Preset = '7d' | '30d' | '90d' | 'mtd';

interface Props {
  activeTab: ReportsTab;
  onTabChange: (tab: ReportsTab) => void;
  preset: Preset;
  onPresetChange: (preset: Preset) => void;
  dateFrom: Date;
  dateTo: Date;
}

export function ReportsTabBar({ activeTab, onTabChange, preset, onPresetChange, dateFrom, dateTo }: Props) {
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

  return (
    <div className="sticky top-[72px] z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-background/95 backdrop-blur-sm border-b border-border/50 pt-5">
      {/* Title + preset picker */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-foreground leading-none">{t('title')}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {format(dateFrom, 'dd MMM yyyy')} — {format(dateTo, 'dd MMM yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/40 p-1">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => onPresetChange(p.key)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer',
                preset === p.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Underline tabs */}
      <div className="flex gap-0" role="tablist">
        {TABS.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            role="tab"
            aria-selected={activeTab === value}
            onClick={() => onTabChange(value)}
            className={cn(
              'relative flex h-11 items-center gap-2 px-4 text-sm font-semibold transition-colors cursor-pointer',
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
