'use client';

import { useMemo, useState } from 'react';
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
  UsersRound,
  LayoutGrid,
  List,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useGroups, GROUPS_KEYS } from '@/hooks/useGroups';
import { useCourses } from '@/hooks/useCourses';
import { groupService } from '@/services/groups';
import type { Group } from '@/types/group';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  const role = user?.role;
  const canManage = role === 'ADMIN' || role === 'MANAGER';
  const teacherScoped = role === 'TEACHER';
  const canRead = canManage || teacherScoped;

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
  const scopedGroups = useMemo(() => {
    if (teacherScoped && user?.id) {
      return allGroups.filter((g) => g.teacher_id === user.id);
    }
    return allGroups;
  }, [allGroups, teacherScoped, user?.id]);

  // Apply filters
  const rows = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim().toLowerCase();
    return scopedGroups.filter((g) => {
      const matchesSearch =
        !normalizedSearch ||
        g.name.toLowerCase().includes(normalizedSearch) ||
        g.course?.title?.toLowerCase().includes(normalizedSearch) ||
        g.teacher?.full_name?.toLowerCase().includes(normalizedSearch);
      const matchesCourse = !courseFilter || g.course_id === courseFilter;
      return matchesSearch && matchesCourse;
    });
  }, [scopedGroups, debouncedSearch, courseFilter]);

  const uniqueCourses = useMemo(() => {
    const set = new Set(scopedGroups.map((g) => g.course?.title).filter(Boolean));
    return set.size;
  }, [scopedGroups]);

  const uniqueTeachers = useMemo(() => {
    const set = new Set(scopedGroups.map((g) => g.teacher_id).filter(Boolean));
    return set.size;
  }, [scopedGroups]);

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
        <h1 className="text-2xl font-black">{tCommon('groups_unavailable')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {tCommon('role_no_access')} {role ? `(${role})` : ''}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-in fade-in duration-700">
      {/* Hero */}
      <section className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/82 shadow-[0_18px_70px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5">
        <div className="relative p-6 sm:p-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_70%_35%,rgba(139,92,246,0.22),transparent_18rem),radial-gradient(circle_at_90%_80%,rgba(59,130,246,0.18),transparent_14rem)] lg:block" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-5">
                <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/7 text-primary">
                  <Users2 className="mr-1.5 size-3.5" />
                  {teacherScoped ? tCommon('your_groups') : tCommon('group_management')}
                </Badge>
                {canManage && <CreateGroupModal />}
              </div>
              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-foreground sm:text-5xl">
                {teacherScoped ? tCommon('your_teaching_groups') : t('title')}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                {teacherScoped ? t('subtitle_teacher') : t('subtitle')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard icon={Users2} label={tCommon('total_groups')} value={scopedGroups.length.toString()} tone="violet" />
        <MetricCard icon={Layers3} label={tCommon('courses')} value={uniqueCourses.toString()} tone="blue" />
        <MetricCard icon={GraduationCap} label={tCommon('teachers')} value={uniqueTeachers.toString()} tone="amber" />
      </section>

      {/* Table card */}
      <Card className="border-white/70 bg-white/82 shadow-[0_16px_60px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5">
        <CardHeader className="gap-5 px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle className="text-xl font-bold">{tCommon('group_roster')}</CardTitle>
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
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
              >
                <option value="">All courses</option>
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
                  title="Table View"
                >
                  <List className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("h-7 px-2", viewMode === 'kanban' && "bg-background shadow-sm")}
                  onClick={() => setViewMode('kanban')}
                  title="Kanban Board"
                >
                  <LayoutGrid className="size-4" />
                </Button>
              </div>
              <Button variant="ghost" size="icon" onClick={refresh} className="size-9 shrink-0" title="Refresh">
                <RefreshCw className={cn('size-4', groupsQuery.isLoading && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
          {groupsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl bg-violet-100/50 dark:bg-violet-950/30" />
              ))}
            </div>
          ) : groupsQuery.isError ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-16 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <AlertCircle className="size-7" />
              </div>
              <h3 className="text-lg font-bold">Failed to load groups</h3>
              <Button variant="outline" size="sm" onClick={refresh} className="mt-4">
                <RefreshCw className="mr-2 size-3.5" /> Try again
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Users2 className="size-7" />
              </div>
              <h3 className="text-lg font-bold">{search || courseFilter ? 'No matching groups' : 'No groups yet'}</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                {canManage ? 'Click "Add Group" to create your first group.' : 'Groups will appear here once created.'}
              </p>
              {(search || courseFilter) && (
                <Button variant="outline" size="sm" onClick={() => { clearSearch(); setCourseFilter(''); }} className="mt-4">
                  Clear filters
                </Button>
              )}
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-hidden rounded-xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Group</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Duration</TableHead>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((group) => (
                    <TableRow key={group.id} className="transition-colors hover:bg-muted/35">
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 rounded-xl">
                            <AvatarFallback className="rounded-xl bg-violet-500/10 font-bold text-violet-600">
                              {group.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <Link
                            href={`/groups/${group.id}`}
                            className="text-sm font-bold text-foreground hover:underline hover:text-primary transition-colors"
                          >
                            {group.name}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
                          {group.course?.title ?? '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {group.teacher?.full_name ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
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
                              title="Delete group"
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

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users2;
  label: string;
  value: string;
  tone: 'violet' | 'blue' | 'amber';
}) {
  const tones = {
    violet: 'from-violet-500 to-purple-500',
    blue: 'from-blue-500 to-sky-500',
    amber: 'from-amber-400 to-orange-500',
  };

  return (
    <Card className="border-white/70 bg-white/80 shadow-[0_14px_50px_rgba(15,23,42,0.07)] backdrop-blur dark:border-white/10 dark:bg-white/5">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-black tabular-nums text-foreground">{value}</p>
        </div>
        <div className={cn('flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg', tones[tone])}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
