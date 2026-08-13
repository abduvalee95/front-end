'use client';

import { useState } from 'react';
import { useTranslations } from '@/i18n/index';
import { BookMarked, Layers } from 'lucide-react';
import { CoursesWorkspace } from '@/components/courses/CoursesWorkspace';
import { SubjectsWorkspace } from '@/components/subjects/SubjectsWorkspace';
import { useCourses } from '@/hooks/useCourses';
import { useSubjects } from '@/hooks/useSubjects';
import { useAuthStore } from '@/store/auth.store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

  const tabs: { id: Tab; label: string; icon: typeof BookMarked; count: number }[] = [
    { id: 'courses', label: t('tab_courses'), icon: BookMarked, count: coursesCount },
    { id: 'subjects', label: t('tab_subjects'), icon: Layers, count: subjectsCount },
  ];

  return (
    <div className="space-y-5">
      {/* ── Tab bar ── */}
      <div className="flex w-fit items-center gap-1 rounded-control border border-border bg-muted p-1" role="tablist">
        {tabs.map(({ id, label, icon: Icon, count }) => {
          const isActive = active === id;
          return (
            <Button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              variant={isActive ? 'primary' : 'ghost'}
              onClick={() => setActive(id)}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">{label}</span>
              <Badge variant="neutral" className="tabular-nums">
                {count}
              </Badge>
            </Button>
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
