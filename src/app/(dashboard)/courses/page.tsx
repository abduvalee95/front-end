'use client';

import { useTranslations } from '@/i18n/index';
import { BookMarked, Layers } from 'lucide-react';
import { CoursesWorkspace } from '@/components/courses/CoursesWorkspace';
import { SubjectsWorkspace } from '@/components/subjects/SubjectsWorkspace';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useCourses } from '@/hooks/useCourses';
import { useSubjects } from '@/hooks/useSubjects';
import { useAuthStore } from '@/store/auth.store';

export default function CoursesPage() {
  const t = useTranslations('courses');
  const role = useAuthStore((s) => s.user?.role);
  const canRead = !!role;

  const coursesQuery = useCourses(canRead);
  const subjectsQuery = useSubjects(canRead);

  const coursesCount = coursesQuery.data?.length ?? 0;
  const subjectsCount = subjectsQuery.data?.length ?? 0;

  return (
    <Tabs defaultValue="courses" className="gap-5">
      <div className="sticky top-0 z-20 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 pt-1 pb-3 bg-gradient-to-b from-background via-background/95 to-transparent backdrop-blur-md">
        <TabsList className="h-12 rounded-2xl bg-muted/70 dark:bg-white/5 p-1.5 gap-1 inline-flex w-fit shadow-[0_2px_12px_rgba(15,23,42,0.04)] ring-1 ring-border/40">
          <TabsTrigger
            value="courses"
            className="group/tab relative h-9 px-4 rounded-xl gap-2 text-[13px] font-semibold text-muted-foreground/80 hover:text-foreground hover:bg-background/50 data-active:bg-background data-active:text-foreground data-active:shadow-[0_4px_14px_rgba(15,23,42,0.08)] data-active:ring-1 data-active:ring-border/60 transition-all duration-200"
          >
            <BookMarked className="size-4 text-indigo-500 dark:text-indigo-400" />
            <span>{t('tab_courses')}</span>
            <span className="inline-flex items-center justify-center min-w-[22px] h-[20px] px-1.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-[10.5px] font-black tabular-nums leading-none">
              {coursesCount}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="subjects"
            className="group/tab relative h-9 px-4 rounded-xl gap-2 text-[13px] font-semibold text-muted-foreground/80 hover:text-foreground hover:bg-background/50 data-active:bg-background data-active:text-foreground data-active:shadow-[0_4px_14px_rgba(15,23,42,0.08)] data-active:ring-1 data-active:ring-border/60 transition-all duration-200"
          >
            <Layers className="size-4 text-emerald-500 dark:text-emerald-400" />
            <span>{t('tab_subjects')}</span>
            <span className="inline-flex items-center justify-center min-w-[22px] h-[20px] px-1.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10.5px] font-black tabular-nums leading-none">
              {subjectsCount}
            </span>
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="courses" className="mt-0">
        <CoursesWorkspace />
      </TabsContent>
      <TabsContent value="subjects" className="mt-0">
        <SubjectsWorkspace />
      </TabsContent>
    </Tabs>
  );
}
