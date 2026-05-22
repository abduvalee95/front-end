'use client';

import { useTranslations } from '@/i18n/index';
import { BookMarked, Layers } from 'lucide-react';
import { CoursesWorkspace } from '@/components/courses/CoursesWorkspace';
import { SubjectsWorkspace } from '@/components/subjects/SubjectsWorkspace';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function CoursesPage() {
  const t = useTranslations('courses');

  return (
    <Tabs defaultValue="courses">
      <TabsList className="mb-2">
        <TabsTrigger value="courses" className="flex items-center gap-1.5">
          <BookMarked className="size-3.5" />
          {t('tab_courses')}
        </TabsTrigger>
        <TabsTrigger value="subjects" className="flex items-center gap-1.5">
          <Layers className="size-3.5" />
          {t('tab_subjects')}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="courses">
        <CoursesWorkspace />
      </TabsContent>
      <TabsContent value="subjects">
        <SubjectsWorkspace />
      </TabsContent>
    </Tabs>
  );
}
