'use client';

import { useState, useMemo } from 'react';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertCircle,
  BookOpen,
  Library,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Users2,
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
import { cn } from '@/lib/utils';
import { CreateCourseModal } from './CreateCourseModal';
import { EditCourseModal } from './EditCourseModal';

export function CoursesWorkspace() {
  const user = useAuthStore((s) => s.user);
  const t = useTranslations('courses');
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
    } catch (error: any) {
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
        <h1 className="text-2xl font-black">{t('courses_unavailable')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('courses_unavailable_desc').replace('{role}', role || '')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Hero */}
      <section className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/82 shadow-[0_18px_70px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5">
        <div className="relative p-6 sm:p-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_70%_35%,rgba(99,102,241,0.22),transparent_18rem),radial-gradient(circle_at_90%_80%,rgba(59,130,246,0.18),transparent_14rem)] lg:block" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-5">
                <Badge variant="outline" className="rounded-full border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                  <Library className="mr-1.5 size-3.5" />
                  {t('course_management')}
                </Badge>
                {canManage && <CreateCourseModal />}
              </div>
              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-foreground sm:text-5xl">
                {t('educational_programs')}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                {t('educational_programs_desc')}
              </p>
            </div>
            
            {/* Quick Metrics right in the hero */}
            <div className="flex shrink-0 gap-4">
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white/40 px-5 py-3 shadow-inner ring-1 ring-white/50 backdrop-blur-md dark:bg-black/20 dark:ring-white/10">
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{allCourses.length}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('total_courses')}</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white/40 px-5 py-3 shadow-inner ring-1 ring-white/50 backdrop-blur-md dark:bg-black/20 dark:ring-white/10">
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{activeCourses}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('active_now')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold tracking-tight">{t('all_courses')}</h2>
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
              className={cn('pl-9 bg-white/50 dark:bg-white/5 backdrop-blur-sm', search && 'pr-9')}
            />
            {search && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-white/50 dark:bg-white/5 backdrop-blur-sm px-3 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
          >
            <option value="">{t('all_statuses')}</option>
            <option value="ACTIVE">{t('status_active')}</option>
            <option value="INACTIVE">{t('status_inactive')}</option>
          </select>
          <Button variant="outline" size="icon" onClick={refresh} className="size-9 shrink-0 bg-white/50 dark:bg-white/5" title={t('refresh')}>
            <RefreshCw className={cn('size-4', coursesQuery.isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Grid Content */}
      {coursesQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-[1.5rem] bg-indigo-100/50 dark:bg-indigo-950/30" />
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
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-24 text-center bg-white/30 dark:bg-white/5 backdrop-blur-sm">
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
              className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border-white/70 bg-white/80 shadow-md backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 dark:border-white/10 dark:bg-white/5"
            >
              {/* Card Header with subtle gradient */}
              <div className="relative h-24 w-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent">
                <div className="absolute right-4 top-4 flex items-center justify-end gap-1">
                  {canManage && (
                    <>
                      <EditCourseModal course={course} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 bg-white/50 text-destructive hover:bg-destructive/90 hover:text-white backdrop-blur-md transition-colors"
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
                <div className="absolute -bottom-6 left-5 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg ring-4 ring-background">
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
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t('price')}</p>
                    <p className="text-xl font-black text-foreground">{course.price}</p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "rounded-full border-transparent shadow-inner",
                      course.status === 'ACTIVE' 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' 
                        : 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400'
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
