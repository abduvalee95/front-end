'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Layers3,
  RefreshCw,
  Search,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useTeachers } from '@/hooks/useTeachers';
import { useGroupEnrollments, useStudentGroups, useStudents, STUDENTS_KEYS } from '@/hooks/useStudents';
import type { Student, StudentStatus } from '@/types/student';
import { studentService } from '@/services/students';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { CreateStudentModal } from './CreateStudentModal';
import { EditStudentModal } from './EditStudentModal';
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
import { cn } from '@/lib/utils';

type ViewMode = 'all' | 'teacher';

type StudentRow = Pick<Student, 'id' | 'name' | 'phone' | 'status'> & {
  address?: string;
  parent?: string;
  groups: string[];
  courses: string[];
  teachers: string[];
};

const pageSize = 10;

export function StudentsWorkspace() {
  const user = useAuthStore((state) => state.user);
  const role = user?.role;
  const canManageScope = role === 'ADMIN' || role === 'MANAGER';
  const teacherScoped = role === 'TEACHER';
  const canReadStudents = canManageScope || teacherScoped;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | ''>('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  const effectiveViewMode: ViewMode = teacherScoped ? 'teacher' : viewMode;
  const effectiveTeacherId = teacherScoped ? user?.id ?? '' : selectedTeacherId;
  const shouldLoadAllStudents = canManageScope && effectiveViewMode === 'all';
  const shouldLoadTeacherStudents = !!effectiveTeacherId && effectiveViewMode === 'teacher';

  const studentsQuery = useStudents(
    {
      page,
      limit: pageSize,
      search: search || undefined,
      status: statusFilter || undefined,
    },
    shouldLoadAllStudents,
  );

  const teachersQuery = useTeachers({
    page: 1,
    limit: 100,
  }, canManageScope);

  const groupsQuery = useStudentGroups(shouldLoadTeacherStudents);

  const teacherGroups = useMemo(() => {
    if (!shouldLoadTeacherStudents) return [];
    return (groupsQuery.data ?? []).filter((group) => {
      const teacherId = group.teacher_id || group.teacher?.id;
      return teacherId === effectiveTeacherId;
    });
  }, [effectiveTeacherId, groupsQuery.data, shouldLoadTeacherStudents]);

  const enrollmentQueries = useGroupEnrollments(
    teacherGroups.map((group) => group.id),
    shouldLoadTeacherStudents && teacherGroups.length > 0,
  );

  const teacherRows = useMemo<StudentRow[]>(() => {
    const rows = new Map<string, StudentRow>();

    enrollmentQueries.forEach((query) => {
      (query.data ?? []).forEach((enrollment) => {
        if (!enrollment.student) return;

        const existing = rows.get(enrollment.student.id);
        const groupName = enrollment.group?.name;
        const courseTitle = enrollment.group?.course?.title;
        const teacherName = enrollment.group?.teacher?.full_name;

        if (existing) {
          if (groupName && !existing.groups.includes(groupName)) existing.groups.push(groupName);
          if (courseTitle && !existing.courses.includes(courseTitle)) existing.courses.push(courseTitle);
          if (teacherName && !existing.teachers.includes(teacherName)) existing.teachers.push(teacherName);
          return;
        }

        rows.set(enrollment.student.id, {
          id: enrollment.student.id,
          name: enrollment.student.name,
          phone: enrollment.student.phone,
          status: enrollment.student.status as StudentStatus,
          groups: groupName ? [groupName] : [],
          courses: courseTitle ? [courseTitle] : [],
          teachers: teacherName ? [teacherName] : [],
        });
      });
    });

    const normalizedSearch = search.trim().toLowerCase();
    return Array.from(rows.values()).filter((student) => {
      const matchesSearch =
        !normalizedSearch ||
        student.name.toLowerCase().includes(normalizedSearch) ||
        student.phone.toLowerCase().includes(normalizedSearch);
      const matchesStatus = !statusFilter || student.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [enrollmentQueries, search, statusFilter]);

  const allRows = useMemo<StudentRow[]>(() => {
    return (studentsQuery.data?.items ?? []).map((student) => ({
      ...student,
      groups: [],
      courses: [],
      teachers: [],
    }));
  }, [studentsQuery.data?.items]);

  const rows = effectiveViewMode === 'all' ? allRows : teacherRows;
  const loading =
    effectiveViewMode === 'all'
      ? studentsQuery.isLoading
      : groupsQuery.isLoading || enrollmentQueries.some((query) => query.isLoading);
  const isError =
    effectiveViewMode === 'all'
      ? studentsQuery.isError
      : groupsQuery.isError || enrollmentQueries.some((query) => query.isError);

  const teacherOptions = teachersQuery.data?.items ?? [];
  const activeCount = rows.filter((student) => student.status === 'ACTIVE').length;
  const inactiveCount = rows.filter((student) => student.status === 'INACTIVE').length;
  const groupCount = new Set(rows.flatMap((student) => student.groups)).size;

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPage(1);
  };

  const refresh = () => {
    if (effectiveViewMode === 'all') {
      studentsQuery.refetch();
      return;
    }
    groupsQuery.refetch();
    enrollmentQueries.forEach((query) => query.refetch());
  };

  if (!canReadStudents) {
    return <AccessDenied role={role} />;
  }

  return (
    <div className="space-y-7 animate-in fade-in duration-700">
      <section className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/82 shadow-[0_18px_70px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5">
        <div className="relative p-6 sm:p-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_70%_35%,rgba(3,203,231,0.22),transparent_18rem),radial-gradient(circle_at_90%_80%,rgba(0,236,129,0.18),transparent_14rem)] lg:block" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-5">
                <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/7 text-primary">
                  <GraduationCap className="mr-1.5 size-3.5" />
                  {teacherScoped ? 'Teacher scope' : 'Student control room'}
                </Badge>
                {canManageScope && <CreateStudentModal />}
              </div>
              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-foreground sm:text-5xl">
                {teacherScoped ? 'Your students, grouped by your classes.' : 'Students by organization or teacher.'}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                {teacherScoped
                  ? 'Only learners connected to your groups are shown here.'
                  : 'Admins and managers can review every student or narrow the list to one teacher.'}
              </p>
            </div>

            {canManageScope && (
              <div className="flex rounded-2xl border border-border/70 bg-background/80 p-1 shadow-sm">
                {[
                  { value: 'all', label: 'All students' },
                  { value: 'teacher', label: 'By teacher' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setViewMode(item.value as ViewMode);
                      setPage(1);
                    }}
                    className={cn(
                      'h-9 rounded-xl px-4 text-sm font-semibold transition-all',
                      viewMode === item.value
                        ? 'bg-slate-950 text-white shadow-sm dark:bg-primary'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard icon={UsersRound} label="Visible students" value={rows.length.toString()} tone="cyan" />
        <MetricCard icon={UserRoundCheck} label="Active" value={activeCount.toString()} tone="emerald" />
        <MetricCard icon={Layers3} label="Groups in view" value={groupCount.toString()} tone="amber" />
      </section>

      <Card className="border-white/70 bg-white/82 shadow-[0_16px_60px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5">
        <CardHeader className="gap-5 px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Student roster</CardTitle>
              <CardDescription>
                {effectiveViewMode === 'all'
                  ? 'Organization-wide list from the student registry.'
                  : 'Students collected from the selected teacher groups.'}
              </CardDescription>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search name or phone..."
                  className="pl-9"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as StudentStatus | '');
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
              >
                <option value="">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              {canManageScope && effectiveViewMode === 'teacher' && (
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
                >
                  <option value="">Choose teacher</option>
                  {teacherOptions.map((teacher) => (
                    <option key={teacher.user_id} value={teacher.user_id}>
                      {teacher.user?.full_name ?? 'Unnamed teacher'}
                    </option>
                  ))}
                </select>
              )}

              <Button variant="ghost" size="icon" onClick={refresh} className="size-9 shrink-0" title="Refresh">
                <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
          {!shouldLoadAllStudents && !shouldLoadTeacherStudents ? (
            <TeacherPrompt />
          ) : isError ? (
            <ErrorState onRetry={refresh} />
          ) : (
            <>
              <StudentsTable
                rows={rows}
                loading={loading}
                teacherScoped={effectiveViewMode === 'teacher'}
                onClear={resetFilters}
                hasFilters={!!(search || statusFilter)}
                canManageScope={canManageScope}
              />

              {effectiveViewMode === 'all' && studentsQuery.data?.meta && studentsQuery.data.meta.pages > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm">
                  <p className="text-muted-foreground">
                    Page <span className="font-semibold text-foreground">{page}</span> of{' '}
                    <span className="font-semibold text-foreground">{studentsQuery.data.meta.pages}</span> ·{' '}
                    <span className="font-semibold text-foreground">{studentsQuery.data.meta.total}</span> total
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={page === 1}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={page >= studentsQuery.data.meta.pages}
                      onClick={() => setPage((current) => current + 1)}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        {teacherScoped
          ? 'Teacher accounts are scoped through group enrollments.'
          : `Inactive in current view: ${inactiveCount}. Teacher filtering uses group enrollments.`}
      </p>
    </div>
  );
}

function StudentsTable({
  rows,
  loading,
  teacherScoped,
  hasFilters,
  onClear,
  canManageScope,
}: {
  rows: StudentRow[];
  loading: boolean;
  teacherScoped: boolean;
  hasFilters: boolean;
  onClear: () => void;
  canManageScope: boolean;
}) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      setIsDeleting(id);
      await studentService.deleteStudent(id);
      toast.success('Student deleted successfully');
      queryClient.invalidateQueries({ queryKey: STUDENTS_KEYS.all });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete student');
    } finally {
      setIsDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-14 rounded-xl bg-cyan-100/50 dark:bg-cyan-950/30" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return <EmptyState hasFilters={hasFilters} onClear={onClear} teacherScoped={teacherScoped} />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Student</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Parent</TableHead>
            <TableHead>{teacherScoped ? 'Group / course' : 'Address'}</TableHead>
            <TableHead>{teacherScoped ? 'Teacher' : 'Phone'}</TableHead>
            {canManageScope && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((student) => (
            <TableRow key={student.id} className="transition-colors hover:bg-muted/35">
              <TableCell className="pl-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-9 rounded-xl">
                    <AvatarFallback className="rounded-xl bg-primary/10 font-bold text-primary">
                      {(student.name || '?').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{student.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{student.phone}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <StudentStatusBadge status={student.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{student.parent || '-'}</TableCell>
              <TableCell className="max-w-[260px] text-sm text-muted-foreground">
                {teacherScoped ? (
                  <div className="space-y-1">
                    <p className="truncate font-medium text-foreground/80">{student.groups.join(', ') || '-'}</p>
                    <p className="truncate text-xs">{student.courses.join(', ') || 'No course linked'}</p>
                  </div>
                ) : (
                  <span className="line-clamp-1">{student.address || '-'}</span>
                )}
              </TableCell>
              <TableCell className="max-w-[220px] text-sm text-muted-foreground">
                {teacherScoped ? student.teachers.join(', ') || '-' : student.phone}
              </TableCell>
              {canManageScope && (
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <EditStudentModal student={student} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={isDeleting === student.id}
                      onClick={() => handleDelete(student.id, student.name)}
                      title="Delete student"
                    >
                      {isDeleting === student.id ? (
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
  );
}

function StudentStatusBadge({ status }: { status: StudentStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full font-semibold',
        status === 'ACTIVE'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
          : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
      )}
    >
      {status?.toLowerCase() || 'unknown'}
    </Badge>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof UsersRound;
  label: string;
  value: string;
  tone: 'cyan' | 'emerald' | 'amber';
}) {
  const tones = {
    cyan: 'from-cyan-500 to-sky-500',
    emerald: 'from-emerald-400 to-teal-500',
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

function TeacherPrompt() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-6 py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <BookOpen className="size-7" />
      </div>
      <h3 className="text-lg font-bold">Choose a teacher</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Select a teacher to see students enrolled in that teacher&apos;s groups.
      </p>
    </div>
  );
}

function EmptyState({
  hasFilters,
  teacherScoped,
  onClear,
}: {
  hasFilters: boolean;
  teacherScoped: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <UsersRound className="size-7" />
      </div>
      <h3 className="text-lg font-bold">{hasFilters ? 'No matching students' : 'No students found'}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {teacherScoped
          ? "Students appear here after they are enrolled into this teacher's groups."
          : 'Students will appear here after they are created in this organization.'}
      </p>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onClear} className="mt-4">
          Clear filters
        </Button>
      )}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertCircle className="size-7" />
      </div>
      <h3 className="text-lg font-bold">Failed to load students</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">Check the backend connection and try again.</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
        <RefreshCw className="mr-2 size-3.5" />
        Try again
      </Button>
    </div>
  );
}

function AccessDenied({ role }: { role?: string }) {
  return (
    <div className="mx-auto mt-20 max-w-xl rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
      <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <AlertCircle className="size-8" />
      </div>
      <h1 className="text-2xl font-black">Students unavailable</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your current role {role ? `(${role})` : ''} does not have access to this roster.
      </p>
    </div>
  );
}
