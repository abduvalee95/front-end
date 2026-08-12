'use client';

import { Users, ClipboardList, DollarSign, GraduationCap } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { useTranslations } from '@/i18n/index';
import type { DashboardSummary } from '@/types/analytics';

interface StatsGridProps {
  summary: DashboardSummary | undefined;
  isLoading: boolean;
}

export function StatsGrid({ summary, isLoading }: StatsGridProps) {
  const t = useTranslations('dashboard');

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={Users}
        tone="primary"
        label={t('total_students')}
        value={summary?.studentsActive ?? 0}
        hint={`${t('inactive')}: ${summary?.studentsInactive ?? 0}`}
        trend={`${summary?.studentsTotal ?? 0} ${t('total')}`}
        trendUp
        isLoading={isLoading}
      />
      <StatCard
        icon={DollarSign}
        tone="success"
        label={t('total_payments')}
        value={summary?.paymentsCount ?? 0}
        unit={t('payments_unit')}
        hint={`${Number(summary?.paymentsTotalAmount ?? 0).toLocaleString()} сом`}
        trend={`${summary?.paymentsCount ?? 0} ${t('count')}`}
        trendUp
        isLoading={isLoading}
      />
      <StatCard
        icon={ClipboardList}
        tone="warning"
        label={t('active_leads')}
        value={summary?.leadsNew ?? 0}
        hint={`${t('contacted')}: ${summary?.leadsContacted ?? 0}`}
        trend={`${summary?.leadsConverted ?? 0} ${t('converted')}`}
        trendUp
        isLoading={isLoading}
      />
      <StatCard
        icon={GraduationCap}
        tone={(summary?.attendanceRate ?? 0) >= 75 ? 'success' : 'danger'}
        label={t('attendance_rate')}
        value={summary?.attendanceRate ?? 0}
        unit="%"
        hint={`${t('present')}: ${summary?.attendancePresent ?? 0}`}
        trend={`${summary?.attendanceAbsent ?? 0} ${t('absent')}`}
        trendUp={(summary?.attendanceRate ?? 0) >= 75}
        progress={summary?.attendanceRate ?? 0}
        isLoading={isLoading}
      />
    </div>
  );
}
