'use client';

import { useState, useMemo } from 'react';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Library,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  GraduationCap,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useCourses } from '@/hooks/useCourses';
import { useTranslations } from '@/i18n/index';
import { queryKeys } from '@/lib/api/query-keys';
import { courseService } from '@/services/courses';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';
import { CreateCourseModal } from './CreateCourseModal';
import { EditCourseModal } from './EditCourseModal';

export function CoursesWorkspace() {
  const user = useAuthStore((s) => s.user);
  const t = useTranslations('courses');
  const tCommon = useTranslations('common');
  const role = user?.role;
  const canManage = role === 'ADMIN' || role === 'MANAGER';
  // Note: Both Teachers and Students can view courses according to the controller
  const canRead = !!role; 

  const { value: search, debouncedValue: debouncedSearch, handleChange: setSearch, clearSearch, isPending: isSearching } = useDebounceSearch({ delay: 300 });
  const [statusFilter, setStatusFilter] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const coursesQuery = useCourses(canRead);
  const queryClient = useQueryClient();

  const allCourses = coursesQuery.data ?? [];

  const rows = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim().toLowerCase();
    return allCourses.filter((c) => {
      const matchesSearch = !normalizedSearch || c.title.toLowerCase().includes(normalizedSearch);
      const matchesStatus = !statusFilter || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [allCourses, debouncedSearch, statusFilter]);

  const activeCourses = useMemo(() => allCourses.filter(c => c.status === 'ACTIVE').length, [allCourses]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(t('delete_confirm').replace('{title}', title))) return;
    try {
      setIsDeleting(id);
      await courseService.deleteCourse(id);
      toast.success(t('delete_success'));
      const user = useAuthStore.getState().user;
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all(user?.organization_id) });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t('delete_failed'));
    } finally {
      setIsDeleting(null);
    }
  };

  const refresh = () => coursesQuery.refetch();

  if (!canRead) {
    return (
      <div className="mx-auto mt-20 max-w-xl rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <AlertCircle className="size-8" />
        </div>
        <h1 className="text-h2">{t('courses_unavailable')}</h1>
        <p className="mt-2 text-body-sm text-muted-foreground">
          {t('courses_unavailable_desc').replace('{role}', role || '')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <PageHeader
        icon={Library}
        eyebrow={t('course_management')}
        title={t('educational_programs')}
        subtitle={t('educational_programs_desc')}
        actions={canManage ? <CreateCourseModal /> : undefined}
        stats={[
          { label: t('total_courses'), value: allCourses.length, icon: Library, tone: 'primary' },
          { label: t('active_now'), value: activeCourses, icon: CheckCircle2, tone: 'success' },
        ]}
        statsLoading={coursesQuery.isLoading}
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-h2 text-foreground">{t('all_courses')}</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative sm:w-72">
            {isSearching ? (
              <Loader2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary animate-spin" />
            ) : (
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            )}
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search_courses')}
              className={cn('pl-9 bg-card  backdrop-blur-sm', search && 'pr-9')}
            />
            {search && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={tCommon('clear')}
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-card backdrop-blur-sm px-3 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
          >
            <option value="">{t('all_statuses')}</option>
            <option value="ACTIVE">{t('status_active')}</option>
            <option value="INACTIVE">{t('status_inactive')}</option>
          </select>
          <Button variant="outline" size="icon" onClick={refresh} className="size-9 shrink-0 bg-card" title={t('refresh')}>
            <RefreshCw className={cn('size-4', coursesQuery.isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Grid Content */}
      {coursesQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-card bg-primary-muted/50 dark:bg-primary-muted/30" />
          ))}
        </div>
      ) : coursesQuery.isError ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-destructive/20 bg-destructive/5 px-6 py-20 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="size-7" />
          </div>
          <h3 className="text-lg font-bold">{t('failed_to_load')}</h3>
          <Button variant="outline" size="sm" onClick={refresh} className="mt-4">
            <RefreshCw className="mr-2 size-3.5" /> {t('try_again')}
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-24 text-center bg-card backdrop-blur-sm">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <BookOpen className="size-8" />
          </div>
          <h3 className="text-xl font-bold">{search || statusFilter ? t('no_matching_courses') : t('no_courses_yet')}</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {canManage ? t('start_building') : t('courses_will_appear')}
          </p>
          {(search || statusFilter) && (
            <Button variant="outline" size="sm" onClick={() => { clearSearch(); setStatusFilter(''); }} className="mt-4">
              {t('clear_filters')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((course) => (
            <Card 
              key={course.id} 
              className="group relative flex flex-col overflow-hidden rounded-card border-border bg-card shadow-md backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
            >
              {/* Card Header with subtle gradient */}
              <div className="relative h-24 w-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
                <div className="absolute right-4 top-4 flex items-center justify-end gap-1">
                  {canManage && (
                    <>
                      <EditCourseModal course={course} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={isDeleting === course.id}
                        onClick={() => handleDelete(course.id, course.title)}
                        title={t('delete_course')}
                      >
                        {isDeleting === course.id ? (
                          <RefreshCw className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
                <div className="absolute -bottom-6 left-5 flex size-12 items-center justify-center rounded-card bg-primary text-primary-foreground shadow-card ring-4 ring-background">
                  <GraduationCap className="size-6" />
                </div>
              </div>

              <CardContent className="flex flex-1 flex-col px-5 pb-5 pt-8">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 text-lg font-bold leading-tight tracking-tight text-foreground">
                    {course.title}
                  </h3>
                </div>
                
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground flex-1">
                  {course.description || t('no_description')}
                </p>

                <div className="mt-5 flex items-end justify-between border-t border-border/50 pt-4">
                  <div>
                    <p className="text-caption font-bold uppercase tracking-widest text-muted-foreground mb-1">{t('price')}</p>
                    <p className="text-xl font-semibold text-foreground">{course.price}</p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "rounded-full border-transparent shadow-inner",
                      course.status === 'ACTIVE' 
                        ? 'bg-success/10 text-success-emphasis dark:bg-success/20 dark:text-success-emphasis' 
                        : 'bg-muted/10 text-foreground dark:bg-muted/20 dark:text-muted-foreground'
                    )}
                  >
                    {course.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
