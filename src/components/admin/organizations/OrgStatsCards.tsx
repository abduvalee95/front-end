'use client';

import { Building2, CheckCircle2, XCircle, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n/index';
import type { PaginatedOrganizationsResponse } from '@/types/platform';

interface OrgStatsCardsProps {
  data: PaginatedOrganizationsResponse | undefined;
  isLoading: boolean;
}

interface StatConfig {
  labelKey: string;
  getValue: (ctx: { total: number; active: number; inactive: number; users: number; rate: number }) => number;
  getSub: (
    ctx: { total: number; active: number; inactive: number; users: number; rate: number },
    t: (key: string, values?: Record<string, string | number>) => string,
  ) => string;
  icon: React.ElementType;
  iconClass: string;
  iconBgClass: string;
  gradientClass: string;
}

const STAT_CONFIGS: StatConfig[] = [
  {
    labelKey: 'dashboard.total_orgs',
    getValue: ({ total }) => total,
    getSub: (_ctx, t) => t('orgs.registered'),
    icon: Building2,
    iconClass: 'text-indigo-600 dark:text-indigo-400',
    iconBgClass: 'bg-indigo-100 dark:bg-indigo-950',
    gradientClass: 'edu-gradient-card-1',
  },
  {
    labelKey: 'active',
    getValue: ({ active }) => active,
    getSub: ({ rate }, t) => t('orgs.activation_rate', { rate }),
    icon: CheckCircle2,
    iconClass: 'text-teal-600 dark:text-teal-400',
    iconBgClass: 'bg-teal-100 dark:bg-teal-950',
    gradientClass: 'edu-gradient-card-2',
  },
  {
    labelKey: 'inactive',
    getValue: ({ inactive }) => inactive,
    getSub: ({ total, rate }, t) => t('orgs.suspended', { rate: total > 0 ? 100 - rate : 0 }),
    icon: XCircle,
    iconClass: 'text-amber-600 dark:text-amber-400',
    iconBgClass: 'bg-amber-100 dark:bg-amber-950',
    gradientClass: 'edu-gradient-card-4',
  },
  {
    labelKey: 'dashboard.total_users',
    getValue: ({ users }) => users,
    getSub: (_ctx, t) => t('orgs.across_page'),
    icon: Users,
    iconClass: 'text-purple-600 dark:text-purple-400',
    iconBgClass: 'bg-purple-100 dark:bg-purple-950',
    gradientClass: 'edu-gradient-card-3',
  },
];

export function OrgStatsCards({ data, isLoading }: OrgStatsCardsProps) {
  const t = useTranslations('admin');
  const items = data?.items ?? [];
  const total = data?.meta?.total ?? 0;
  const active = items.filter((o) => o.status === 'ACTIVE').length;
  const inactive = items.filter((o) => o.status === 'INACTIVE').length;
  const users = items.reduce((sum, o) => sum + o.usersCount, 0);
  const rate = total > 0 ? Math.round((active / total) * 100) : 0;
  const ctx = { total, active, inactive, users, rate };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden border-0 shadow-sm">
            <Skeleton className="h-1 bg-indigo-100/50 dark:bg-indigo-950/30" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="size-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {STAT_CONFIGS.map((cfg) => {
        const value = cfg.getValue(ctx);
        const sub = cfg.getSub(ctx, t);
        return (
          <Card key={cfg.labelKey} className="overflow-hidden border-0 shadow-sm">
            {/* Gradient top bar — 3px */}
            <div className={`h-1 ${cfg.gradientClass}`} />
            
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t(cfg.labelKey)}
              </CardTitle>
              <div className={`h-9 w-9 rounded-lg ${cfg.iconBgClass} flex items-center justify-center`}>
                <cfg.icon className={cn('h-5 w-5', cfg.iconClass)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                {value.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
