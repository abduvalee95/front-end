'use client';

import { useState } from 'react';
import { useTranslations } from '@/i18n/index';
import { BookMarked, Layers } from 'lucide-react';
import { CoursesWorkspace } from '@/components/courses/CoursesWorkspace';
import { SubjectsWorkspace } from '@/components/subjects/SubjectsWorkspace';
import { useCourses } from '@/hooks/useCourses';
import { useSubjects } from '@/hooks/useSubjects';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

type Tab = 'courses' | 'subjects';

export default function CoursesPage() {
  const t = useTranslations('courses');
  const [active, setActive] = useState<Tab>('courses');
  const role = useAuthStore((s) => s.user?.role);
  const canRead = !!role;

  const coursesQuery = useCourses(canRead);
  const subjectsQuery = useSubjects(canRead);

  const coursesCount = coursesQuery.data?.length ?? 0;
  const subjectsCount = subjectsQuery.data?.length ?? 0;

  const tabs: { id: Tab; label: string; icon: typeof BookMarked; count: number; accent: string; countCls: string }[] = [
    {
      id: 'courses',
      label: t('tab_courses'),
      icon: BookMarked,
      count: coursesCount,
      accent: 'data-active:text-indigo-600 dark:data-active:text-indigo-400',
      countCls: 'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300',
    },
    {
      id: 'subjects',
      label: t('tab_subjects'),
      icon: Layers,
      count: subjectsCount,
      accent: 'data-active:text-emerald-600 dark:data-active:text-emerald-400',
      countCls: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── Tab bar ── */}
      <div className="flex items-center gap-1 w-fit rounded-2xl bg-muted/60 dark:bg-white/5 p-1.5 ring-1 ring-border/40 shadow-sm">
        {tabs.map(({ id, label, icon: Icon, count, countCls }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              data-active={isActive ? '' : undefined}
              className={cn(
                'flex items-center gap-2 h-9 px-3 sm:px-4 rounded-xl text-[13px] font-semibold transition-all duration-200 whitespace-nowrap',
                isActive
                  ? 'bg-background text-foreground shadow-[0_2px_10px_rgba(15,23,42,0.08)] ring-1 ring-border/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
              )}
            >
              <Icon
                className={cn(
                  'size-4 shrink-0 transition-colors',
                  isActive
                    ? id === 'courses'
                      ? 'text-indigo-500 dark:text-indigo-400'
                      : 'text-emerald-500 dark:text-emerald-400'
                    : 'text-muted-foreground/60',
                )}
              />
              <span className="hidden sm:inline">{label}</span>
              <span
                className={cn(
                  'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black tabular-nums leading-none transition-colors',
                  isActive ? countCls : 'bg-muted-foreground/10 text-muted-foreground/60',
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      <div>
        {active === 'courses' && <CoursesWorkspace />}
        {active === 'subjects' && <SubjectsWorkspace />}
      </div>
    </div>
  );
}
