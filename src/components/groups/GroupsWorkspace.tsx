'use client';

import { useState } from 'react';
import { useTranslations } from '@/i18n/index';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertCircle,
  Calendar,
  GraduationCap,
  Layers3,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Users2,
  LayoutGrid,
  List,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { usePermissions } from '@/hooks/usePermissions';
import { useGroups, GROUPS_KEYS } from '@/hooks/useGroups';
import { useCourses } from '@/hooks/useCourses';
import { groupService } from '@/services/groups';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CreateGroupModal } from './CreateGroupModal';
import { EditGroupModal } from './EditGroupModal';
import { EnrollStudentModal } from './EnrollStudentModal';
import { GroupsKanbanBoard } from './GroupsKanbanBoard';

export function GroupsWorkspace() {
  const t = useTranslations('groups');
  const tCommon = useTranslations('common');
  const user = useAuthStore((s) => s.user);
  const { role, canManageGroups: canManage, teacherScoped, canReadGroups: canRead } = usePermissions();

  const { value: search, debouncedValue: debouncedSearch, handleChange: setSearch, clearSearch, isPending: isSearching } = useDebounceSearch({ delay: 300 });
  const [courseFilter, setCourseFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  const groupsQuery = useGroups(canRead);
  const coursesQuery = useCourses(canRead);
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const allGroups = groupsQuery.data ?? [];
  const courses = coursesQuery.data ?? [];

  // Teacher sees only their groups
  const scopedGroups = (() => {
    if (teacherScoped && user?.id) {
      return allGroups.filter((g) => g.teacher_id === user.id);
    }
    return allGroups;
  })();

  // Apply filters
  const normalizedSearch = debouncedSearch.trim().toLowerCase();
  const rows = scopedGroups.filter((g) => {
    const matchesSearch =
      !normalizedSearch ||
      g.name.toLowerCase().includes(normalizedSearch) ||
      g.course?.title?.toLowerCase().includes(normalizedSearch) ||
      g.teacher?.full_name?.toLowerCase().includes(normalizedSearch);
    const matchesCourse = !courseFilter || g.course_id === courseFilter;
    return matchesSearch && matchesCourse;
  });

  const uniqueCourses = (() => {
    const set = new Set(scopedGroups.map((g) => g.course?.title).filter(Boolean));
    return set.size;
  })();

  const uniqueTeachers = (() => {
    const set = new Set(scopedGroups.map((g) => g.teacher_id).filter(Boolean));
    return set.size;
  })();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${tCommon('confirm_delete')} "${name}"? ${tCommon('groups_with_enrollments_cannot_delete')}`)) return;
    try {
      setIsDeleting(id);
      await groupService.deleteGroup(id);
      toast.success(tCommon('group_deleted_success'));
      queryClient.invalidateQueries({ queryKey: GROUPS_KEYS.all(user?.organization_id) });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || tCommon('failed_delete_group'));
    } finally {
      setIsDeleting(null);
    }
  };

  const refresh = () => groupsQuery.refetch();

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  if (!canRead) {
    return (
      <div className="mx-auto mt-20 max-w-xl rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <AlertCircle className="size-8" />
        </div>
        <h1 className="text-h2">{tCommon('groups_unavailable')}</h1>
        <p className="mt-2 text-body-sm text-muted-foreground">
          {tCommon('role_no_access')} {role ? `(${role})` : ''}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <PageHeader
        icon={Users2}
        eyebrow={teacherScoped ? tCommon('your_groups') : tCommon('group_management')}
        title={teacherScoped ? tCommon('your_teaching_groups') : t('title')}
        subtitle={teacherScoped ? t('subtitle_teacher') : t('subtitle')}
        actions={canManage ? <CreateGroupModal /> : undefined}
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard icon={Users2} label={tCommon('total_groups')} value={scopedGroups.length} tone="primary" isLoading={groupsQuery.isLoading} />
        <StatCard icon={Layers3} label={tCommon('courses')} value={uniqueCourses} tone="neutral" isLoading={groupsQuery.isLoading} />
        <StatCard icon={GraduationCap} label={tCommon('teachers')} value={uniqueTeachers} tone="success" isLoading={groupsQuery.isLoading} />
      </section>

      {/* Table card */}
      <Card>
        <CardHeader className="gap-5 px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle>{tCommon('group_roster')}</CardTitle>
              <CardDescription>
                {teacherScoped ? t('subtitle_teacher') : t('subtitle')}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative sm:w-64">
                {isSearching ? (
                  <Loader2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary animate-spin" />
                ) : (
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                )}
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`${tCommon('search')} ${t('group_name')}...`}
                  className={cn('pl-9', search && 'pr-9')}
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
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-body text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
              >
                <option value="">{t('all_courses')}</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <div className="flex items-center rounded-lg border bg-muted/50 p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("h-7 px-2", viewMode === 'table' && "bg-background shadow-sm")}
                  onClick={() => setViewMode('table')}
                  title={t('table_view')}
                >
                  <List className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("h-7 px-2", viewMode === 'kanban' && "bg-background shadow-sm")}
                  onClick={() => setViewMode('kanban')}
                  title={t('kanban_view')}
                >
                  <LayoutGrid className="size-4" />
                </Button>
              </div>
              <Button variant="ghost" size="icon" onClick={refresh} className="size-9 shrink-0" title={tCommon('refresh')}>
                <RefreshCw className={cn('size-4', groupsQuery.isLoading && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
          {groupsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl bg-primary-muted/50 dark:bg-primary-muted/30" />
              ))}
            </div>
          ) : groupsQuery.isError ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-16 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <AlertCircle className="size-7" />
              </div>
              <h3 className="text-h3">{t('failed_load')}</h3>
              <Button variant="outline" size="sm" onClick={refresh} className="mt-4">
                <RefreshCw className="mr-2 size-3.5" /> {tCommon('try_again')}
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Users2 className="size-7" />
              </div>
              <h3 className="text-h3">{search || courseFilter ? t('no_matching') : t('no_groups_yet')}</h3>
              <p className="mt-2 max-w-sm text-body text-muted-foreground">
                {canManage ? t('empty_admin') : t('empty_viewer')}
              </p>
              {(search || courseFilter) && (
                <Button variant="outline" size="sm" onClick={() => { clearSearch(); setCourseFilter(''); }} className="mt-4">
                  {t('clear_filters')}
                </Button>
              )}
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-hidden rounded-xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">{t('th_group')}</TableHead>
                    <TableHead>{t('th_course')}</TableHead>
                    <TableHead>{t('th_teacher')}</TableHead>
                    <TableHead>{t('th_duration')}</TableHead>
                    {canManage && <TableHead className="text-right">{t('th_actions')}</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((group) => (
                    <TableRow key={group.id} className="transition-colors hover:bg-muted/35">
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 rounded-xl">
                            <AvatarFallback className="rounded-xl bg-primary/10 font-bold text-primary-emphasis">
                              {group.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <Link
                            href={`/groups/${group.id}`}
                            className="text-h4 text-foreground hover:underline hover:text-primary transition-colors"
                          >
                            {group.name}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-full border-primary/30 bg-primary-muted text-primary-emphasis dark:border-primary/30 dark:bg-primary/10 dark:text-primary-emphasis">
                          {group.course?.title ?? '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-body text-muted-foreground">
                        {group.teacher?.full_name ?? '—'}
                      </TableCell>
                      <TableCell className="text-body text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5" />
                          <span>{formatDate(group.start_date)} — {formatDate(group.end_date)}</span>
                        </div>
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <EnrollStudentModal groupId={group.id} groupName={group.name} />
                            <EditGroupModal group={group} />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              disabled={isDeleting === group.id}
                              onClick={() => handleDelete(group.id, group.name)}
                              title={t('delete_group_title')}
                            >
                              {isDeleting === group.id ? (
                                <RefreshCw className="size-4 animate-spin" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <GroupsKanbanBoard
              groups={rows}
              canManage={canManage}
              isDeleting={isDeleting}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
