'use client';

import { BadgeCheck, CircleDollarSign, GraduationCap, Layers3, TrendingUp, UserRoundCheck, UsersRound, XCircle } from 'lucide-react';
import { useTranslations } from '@/i18n/index';
import { PageHeader, type PageHeaderStat } from '@/components/ui/page-header';
import { CreateStudentModal } from './CreateStudentModal';

interface StudentsHeroProps {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  groupCount: number;
  rowsLength: number;
  activeRatio: number;
  paidCount: number;
  unpaidCount: number;
  partialCount: number;
  teacherScoped: boolean;
  canManageScope: boolean;
}

export function StudentsHero({
  totalCount,
  activeCount,
  inactiveCount,
  groupCount,
  rowsLength,
  activeRatio,
  paidCount,
  unpaidCount,
  partialCount,
  teacherScoped,
  canManageScope,
}: StudentsHeroProps) {
  const t = useTranslations('students');
  const tCommon = useTranslations('common');

  const stats: PageHeaderStat[] = [
    { label: tCommon('total'), value: totalCount, icon: UsersRound, tone: 'primary' },
    { label: tCommon('active'), value: activeCount, icon: UserRoundCheck, tone: 'success' },
    { label: tCommon('groups'), value: groupCount, icon: Layers3, tone: 'neutral' },
    { label: t('pay_paid'), value: paidCount, icon: BadgeCheck, tone: 'success' },
    { label: t('pay_partial'), value: partialCount, icon: CircleDollarSign, tone: 'warning' },
    { label: t('pay_unpaid'), value: unpaidCount, icon: XCircle, tone: 'danger' },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={GraduationCap}
        eyebrow={teacherScoped ? tCommon('teacher_scope') : tCommon('student_registry')}
        title={teacherScoped ? tCommon('your_students') : t('title')}
        subtitle={teacherScoped ? t('subtitle_teacher') : t('subtitle')}
        actions={canManageScope ? <CreateStudentModal /> : undefined}
        stats={stats}
      />

      {rowsLength > 0 && (
        <div className="rounded-card border border-border bg-card px-4 py-3 shadow-card sm:px-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
              <TrendingUp className="size-3.5 text-success-emphasis" />
              {tCommon('active_rate')}
            </span>
            <span className="text-caption font-semibold tabular-nums text-success-emphasis">{activeRatio}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-control bg-muted">
            <div
              className="h-full rounded-control bg-success transition-[width] duration-700"
              style={{ width: `${activeRatio}%` }}
            />
          </div>
          <div className="mt-2 flex gap-4 text-caption font-normal text-muted-foreground">
            <span>
              <span className="font-semibold tabular-nums text-success-emphasis">{activeCount}</span> {tCommon('active')}
            </span>
            <span>
              <span className="font-semibold tabular-nums text-foreground">{inactiveCount}</span> {tCommon('inactive')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
