'use client';

import { CalendarDays, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from '@/i18n/index';
import type { DashboardSummary } from '@/types/analytics';

interface RecentActivityProps {
  summary: DashboardSummary | undefined;
  isLoading: boolean;
}

export function RecentActivity({ summary, isLoading }: RecentActivityProps) {
  const t = useTranslations('dashboard');

  return (
    <div className="bg-card rounded-2xl p-6 h-full shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-foreground tracking-tight">{t('recent_activity')}</h3>
        <button className="flex items-center gap-0.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
          {t('view_all')} <ChevronRight className="size-3" />
        </button>
      </div>
      <div className="space-y-1">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 p-2">
              <Skeleton className="size-8 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1 py-0.5">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-2.5 w-24" />
              </div>
            </div>
          ))
        ) : summary?.upcomingLessons && summary.upcomingLessons.length > 0 ? (
          summary.upcomingLessons.slice(0, 5).map((lesson) => (
            <div
              key={lesson.id}
              className="group flex gap-3 rounded-xl p-2.5 cursor-pointer hover:bg-accent transition-colors"
            >
              <div className="size-8 rounded-lg shrink-0 flex items-center justify-center bg-primary-muted text-primary-emphasis dark:bg-primary/10 dark:text-primary-emphasis">
                <CalendarDays className="size-3.5" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-foreground group-hover:text-primary-emphasis dark:group-hover:text-primary-emphasis transition-colors truncate">
                  {lesson.title}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground truncate">{lesson.course_title}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-[11px] text-muted-foreground text-center py-8">{t('no_upcoming_lessons')}</p>
        )}
      </div>

      <div className="mt-5 pt-5 border-t border-border">
        <div className="rounded-xl bg-gradient-to-br from-muted to-primary/60 dark:to-primary/5 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3">
            {t('overall_attendance')}
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-20 mb-3" />
          ) : (
            <div className="flex items-baseline gap-1.5 mb-3">
              <span className="text-2xl font-black text-foreground tabular-nums">{summary?.attendanceRate || 0}</span>
              <span className="text-xs font-bold text-muted-foreground">%</span>
              <span className="text-[10px] font-medium text-muted-foreground ml-1">
                {summary?.attendancePresent || 0} {t('present')}
              </span>
            </div>
          )}
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${summary?.attendanceRate || 0}%`,
                background: 'linear-gradient(90deg, #6366f1, #818cf8)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
