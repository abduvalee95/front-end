'use client';

import { useState } from 'react';
import { LayoutDashboard, Users, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRangeProvider } from '@/hooks/useAnalytics';
import { DateRangeFilter } from './date-range-filter';
import { OverviewTab } from './overview-tab';
import { CRMTab } from './crm-tab';
import { LMSTab } from './lms-tab';

type TabKey = 'overview' | 'crm' | 'lms';

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'crm', label: 'CRM', icon: Users },
  { key: 'lms', label: 'LMS', icon: GraduationCap },
];

export function AnalyticsDashboard() {
  const [active, setActive] = useState<TabKey>('overview');

  return (
    <DateRangeProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Live platform metrics powered by real backend data.
            </p>
          </div>
          <DateRangeFilter />
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = active === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActive(t.key)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab body */}
        <div>
          {active === 'overview' && <OverviewTab />}
          {active === 'crm' && <CRMTab />}
          {active === 'lms' && <LMSTab />}
        </div>
      </div>
    </DateRangeProvider>
  );
}
