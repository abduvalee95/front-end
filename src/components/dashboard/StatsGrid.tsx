'use client';

import { Users, ClipboardList, DollarSign, GraduationCap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from '@/i18n/index';
import type { DashboardSummary } from '@/types/analytics';
import { StatCard } from './StatCard';

interface StatsGridProps {
  summary: DashboardSummary | undefined;
  isLoading: boolean;
}

export function StatsGrid({ summary, isLoading }: StatsGridProps) {
  const t = useTranslations('dashboard');

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-2xl p-5 shadow-sm">
            <Skeleton className="h-9 w-9 rounded-xl mb-5" />
            <Skeleton className="h-8 w-20 mb-1.5" />
            <Skeleton className="h-3 w-24 mb-1" />
            <Skeleton className="h-2.5 w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title={t('total_students')}
        value={String(summary?.studentsActive || 0)}
        subtitle={`${t('inactive')}: ${summary?.studentsInactive || 0}`}
        icon={Users}
        trend={`${summary?.studentsTotal || 0} ${t('total')}`}
        trendUp={true}
        color="#3b82f6"
      />
      <StatCard
        title={t('total_payments')}
        value={String(summary?.paymentsCount || 0)}
        unit={t('payments_unit')}
        subtitle={`${Number(summary?.paymentsTotalAmount || 0).toLocaleString()} сом`}
        icon={DollarSign}
        trend={`${summary?.paymentsCount || 0} ${t('count')}`}
        trendUp={true}
        color="#2dd4bf"
      />
      <StatCard
        title={t('active_leads')}
        value={String(summary?.leadsNew || 0)}
        subtitle={`${t('contacted')}: ${summary?.leadsContacted || 0}`}
        icon={ClipboardList}
        trend={`${summary?.leadsConverted || 0} ${t('converted')}`}
        trendUp={true}
        color="#f59e0b"
      />
      <StatCard
        title={t('attendance_rate')}
        value={String(summary?.attendanceRate || 0)}
        unit="%"
        subtitle={`${t('present')}: ${summary?.attendancePresent || 0}`}
        icon={GraduationCap}
        trend={`${summary?.attendanceAbsent || 0} ${t('absent')}`}
        trendUp={(summary?.attendanceRate || 0) >= 75}
        color="#8b5cf6"
      />
    </div>
  );
}
