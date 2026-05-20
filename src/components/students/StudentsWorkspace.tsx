'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from '@/i18n/index';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import Link from 'next/link';
import {
  AlertCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  GraduationCap,
  Layers3,
  Loader2,
  PenLine,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  TrendingUp,
  UserRoundCheck,
  UsersRound,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useTeachers } from '@/hooks/useTeachers';
import { useGroupEnrollments, useStudentGroups, useStudents } from '@/hooks/useStudents';
import type { Student, StudentStatus } from '@/types/student';
import { studentService } from '@/services/students';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-keys';
import { toast } from 'sonner';
import { CreateStudentModal } from './CreateStudentModal';
import { EditStudentModal } from './EditStudentModal';
import { BulkImportDialog } from '@/components/shared/BulkImportDialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700',
  'bg-orange-100 text-orange-700',
];

function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export function StudentsWorkspace() {
  const t = useTranslations('students');
  const tCommon = useTranslations('common');
  const user = useAuthStore((state) => state.user);
  const role = user?.role;
  const canManageScope = role === 'ADMIN' || role === 'MANAGER';
  const teacherScoped = role === 'TEACHER';
  const canReadStudents = canManageScope || teacherScoped;

  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const { value: search, debouncedValue: debouncedSearch, handleChange: setSearch, clearSearch, isPending: isSearching } = useDebounceSearch({
    delay: 300,
    onDebouncedChange: () => setPage(1),
  });
  const [statusFilter, setStatusFilter] = useState<StudentStatus | ''>('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleBulkImport = async (data: Record<string, unknown>[]) => {
    const students = data.map(item => ({
      name: String(item.name || '').trim(),
      phone: String(item.phone || '').trim(),
      address: String(item.address || '').trim(),
      parent: item.parent ? String(item.parent).trim() : undefined,
      status: 'ACTIVE' as const,
    }));
    await studentService.bulkCreate(students);
    queryClient.invalidateQueries({ queryKey: queryKeys.students.all(user?.organization_id) });
  };

  const effectiveViewMode: ViewMode = teacherScoped ? 'teacher' : viewMode;
  const effectiveTeacherId = teacherScoped ? user?.id ?? '' : selectedTeacherId;
  const shouldLoadAllStudents = canManageScope && effectiveViewMode === 'all';
  const shouldLoadTeacherStudents = !!effectiveTeacherId && effectiveViewMode === 'teacher';
  const shouldLoadAllGroups = canManageScope && effectiveViewMode === 'all';

  const studentsQuery = useStudents(
    { page, limit: pageSize, search: debouncedSearch || undefined, status: statusFilter || undefined },
    shouldLoadAllStudents,
  );

  const teachersQuery = useTeachers({ page: 1, limit: 100 }, canManageScope);
  const allGroupsQuery = useStudentGroups(shouldLoadAllGroups);
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
    const normalizedSearch = debouncedSearch.trim().toLowerCase();
    return Array.from(rows.values()).filter((student) => {
      const matchesSearch = !normalizedSearch || student.name.toLowerCase().includes(normalizedSearch) || student.phone.toLowerCase().includes(normalizedSearch);
      const matchesStatus = !statusFilter || student.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [enrollmentQueries, debouncedSearch, statusFilter]);

  const allGroupIds = useMemo(() => (allGroupsQuery.data ?? []).map((g) => g.id), [allGroupsQuery.data]);
  const allEnrollmentQueries = useGroupEnrollments(allGroupIds, shouldLoadAllGroups && allGroupIds.length > 0);

  const allRows = useMemo<StudentRow[]>(() => {
    const enrollmentMap = new Map<string, { groups: string[]; courses: string[]; teachers: string[] }>();
    allEnrollmentQueries.forEach((query) => {
      (query.data ?? []).forEach((enrollment) => {
        if (!enrollment.student) return;
        const existing = enrollmentMap.get(enrollment.student.id);
        const groupName = enrollment.group?.name;
        const courseTitle = enrollment.group?.course?.title;
        const teacherName = enrollment.group?.teacher?.full_name;
        if (existing) {
          if (groupName && !existing.groups.includes(groupName)) existing.groups.push(groupName);
          if (courseTitle && !existing.courses.includes(courseTitle)) existing.courses.push(courseTitle);
          if (teacherName && !existing.teachers.includes(teacherName)) existing.teachers.push(teacherName);
        } else {
          enrollmentMap.set(enrollment.student.id, {
            groups: groupName ? [groupName] : [],
            courses: courseTitle ? [courseTitle] : [],
            teachers: teacherName ? [teacherName] : [],
          });
        }
      });
    });
    return (studentsQuery.data?.items ?? []).map((student) => {
      const info = enrollmentMap.get(student.id);
      return { ...student, groups: info?.groups ?? [], courses: info?.courses ?? [], teachers: info?.teachers ?? [] };
    });
  }, [studentsQuery.data?.items, allEnrollmentQueries]);

  const rows = effectiveViewMode === 'all' ? allRows : teacherRows;
  const loading = effectiveViewMode === 'all' ? studentsQuery.isLoading : groupsQuery.isLoading || enrollmentQueries.some((q) => q.isLoading);
  const isError = effectiveViewMode === 'all' ? studentsQuery.isError : groupsQuery.isError || enrollmentQueries.some((q) => q.isError);
  const totalCount = effectiveViewMode === 'all' ? (studentsQuery.data?.meta.total ?? 0) : rows.length;
  const teacherOptions = teachersQuery.data?.items ?? [];
  const activeCount = rows.filter((s) => s.status === 'ACTIVE').length;
  const inactiveCount = rows.filter((s) => s.status === 'INACTIVE').length;
  const activeRatio = rows.length > 0 ? Math.round((activeCount / rows.length) * 100) : 0;
  const groupCount = new Set(rows.flatMap((s) => s.groups)).size;

  const resetFilters = () => { clearSearch(); setStatusFilter(''); setPage(1); };
  const refresh = () => {
    if (effectiveViewMode === 'all') { studentsQuery.refetch(); return; }
    groupsQuery.refetch();
    enrollmentQueries.forEach((q) => q.refetch());
  };

  if (!canReadStudents) return <AccessDenied role={role} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.25),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.15),transparent_50%)]" />
        <div className="absolute right-0 top-0 h-full w-1/3 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-60" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex size-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <GraduationCap className="size-5 text-indigo-300" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                {teacherScoped ? tCommon('teacher_scope') : tCommon('student_registry')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              {teacherScoped ? tCommon('your_students') : t('title')}
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-lg">
              {teacherScoped ? t('subtitle_teacher') : t('subtitle')}
            </p>

            {canManageScope && (
              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <CreateStudentModal />
                <Button
                  variant="outline"
                  onClick={() => setIsImportOpen(true)}
                  className="h-10 rounded-xl border-white/20 bg-white/8 text-white hover:bg-white/15 hover:text-white backdrop-blur-sm"
                >
                  <FileSpreadsheet className="mr-2 size-4 text-emerald-400" />
                  {tCommon('import_excel')}
                </Button>
              </div>
            )}
          </div>

          {/* Stats strip */}
          <div className="flex shrink-0 gap-3 lg:gap-4">
            {[
              { label: tCommon('total'), value: totalCount, icon: UsersRound, color: 'text-indigo-300' },
              { label: tCommon('active'), value: activeCount, icon: UserRoundCheck, color: 'text-emerald-300' },
              { label: tCommon('groups'), value: groupCount, icon: Layers3, color: 'text-amber-300' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/6 px-5 py-4 min-w-[80px] backdrop-blur-sm">
                <Icon className={cn('size-4 mb-1.5', color)} />
                <span className="text-2xl font-black tabular-nums">{value}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active ratio bar */}
        {rows.length > 0 && (
          <div className="relative mt-6 pt-5 border-t border-white/8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-emerald-400" />
                {tCommon('active_rate')}
              </span>
              <span className="text-xs font-bold text-emerald-300">{activeRatio}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                style={{ width: `${activeRatio}%` }}
              />
            </div>
            <div className="mt-2 flex gap-4">
              <span className="text-[11px] text-slate-400"><span className="font-semibold text-emerald-300">{activeCount}</span> {tCommon('active')}</span>
              <span className="text-[11px] text-slate-400"><span className="font-semibold text-slate-300">{inactiveCount}</span> {tCommon('inactive')}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border/60 bg-background/80 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            {isSearching
              ? <Loader2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 animate-spin text-primary" />
              : <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            }
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`${tCommon('search')} ${t('full_name')} ${tCommon('or')} ${t('phone')}…`}
              className={cn('h-9 pl-8 text-sm rounded-xl', search && 'pr-8')}
            />
            {search && (
              <button type="button" onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground transition-colors">
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Status pills */}
          <div className="flex rounded-xl border border-border/60 bg-muted/40 p-0.5">
            {([['', t('all')], ['ACTIVE', t('status_active')], ['INACTIVE', t('status_inactive')]] as [string, string][]).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => { setStatusFilter(val as StudentStatus | ''); setPage(1); }}
                className={cn(
                  'h-7 rounded-lg px-3 text-xs font-semibold transition-all',
                  statusFilter === val
                    ? val === 'ACTIVE'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : val === 'INACTIVE'
                        ? 'bg-slate-600 text-white shadow-sm'
                        : 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>

        </div>

        <div className="flex items-center gap-2">
          {/* Teacher filter — only visible in teacher view mode */}
          {canManageScope && effectiveViewMode === 'teacher' && (
            <Select
              value={selectedTeacherId || '_all_'}
              onValueChange={(v) => { setSelectedTeacherId(v === '_all_' ? '' : (v ?? '')); setPage(1); }} 
            >
              <SelectTrigger className="h-9 w-auto min-w-[160px] rounded-xl text-xs font-medium">
                <span className="flex items-center gap-2 mr-1">
                  <UsersRound className="size-3.5 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder={t('all_teachers')} />
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all_">{t('all_teachers')}</SelectItem>
                {teacherOptions.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>{teacher.full_name ?? t('unnamed')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* View mode toggle */}
          {canManageScope && (
            <div className="flex rounded-xl border border-border/60 bg-muted/40 p-0.5">
              {([['all', t('all')], ['teacher', t('by_teacher')]] as [ViewMode, string][]).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { setViewMode(val); setPage(1); }}
                  className={cn(
                    'h-7 rounded-lg px-3 text-xs font-semibold transition-all',
                    viewMode === val ? 'bg-slate-950 text-white shadow-sm dark:bg-primary' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Table card ───────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
        {/* Table header row */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
          <div>
            <p className="text-sm font-bold text-foreground">{t('student_roster')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {effectiveViewMode === 'all'
                ? `${studentsQuery.data?.meta.total ?? rows.length} ${t('students_total')}`
                : `${rows.length} ${t('students_from_teacher')}`}
            </p>
          </div>
          {(search || statusFilter) && (
            <button type="button" onClick={resetFilters} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-lg border border-border/60 px-2.5 py-1.5">
              <X className="size-3" /> {t('clear_filters')}
            </button>
          )}
        </div>

        {!shouldLoadAllStudents && !shouldLoadTeacherStudents ? (
          <TeacherPrompt />
        ) : isError ? (
          <ErrorState onRetry={refresh} />
        ) : loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[60px] rounded-xl" style={{ opacity: 1 - i * 0.12 }} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState hasFilters={!!(search || statusFilter)} onClear={resetFilters} teacherScoped={effectiveViewMode === 'teacher'} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/50">
                <TableHead className="w-8 pl-5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('col_number')}</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('col_student')}</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('col_status')}</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('col_parent')}</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {teacherScoped ? t('col_group_course') : t('col_group_course')}
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {teacherScoped ? t('col_teacher') : t('col_phone')}
                </TableHead>
                {canManageScope && <TableHead className="w-20 pr-4 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('col_actions')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((student, idx) => (
                <StudentTableRow
                  key={student.id}
                  student={student}
                  index={(page - 1) * pageSize + idx + 1}
                  teacherScoped={effectiveViewMode === 'teacher'}
                  canManageScope={canManageScope}
                  orgId={user?.organization_id}
                />
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {effectiveViewMode === 'all' && studentsQuery.data?.meta && studentsQuery.data.meta.pages > 1 && (
          <div className="flex items-center justify-between border-t border-border/50 px-5 py-3">
            <p className="text-xs text-muted-foreground">
              Page <span className="font-bold text-foreground">{page}</span> {t('page_of')}{' '}
              <span className="font-bold text-foreground">{studentsQuery.data.meta.pages}</span>
              <span className="mx-2 text-border">·</span>
              <span className="font-bold text-foreground">{studentsQuery.data.meta.total}</span> {t('col_student').toLowerCase()}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="size-8 rounded-lg" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="size-8 rounded-lg" disabled={page >= studentsQuery.data.meta.pages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <BulkImportDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleBulkImport}
        title={t('import_title')}
        description={t('import_desc')}
        requiredFields={['name', 'phone']}
        columnMapping={{ 'Full Name': 'name', 'Phone': 'phone', 'Address': 'address', 'Parent Name': 'parent' }}
      />
    </div>
  );
}

function StudentTableRow({
  student,
  index,
  teacherScoped,
  canManageScope,
  orgId,
}: {
  student: StudentRow;
  index: number;
  teacherScoped: boolean;
  canManageScope: boolean;
  orgId?: string;
}) {
  const t = useTranslations('students');
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(t('delete_confirm').replace('{name}', student.name))) return;
    try {
      setIsDeleting(true);
      await studentService.deleteStudent(student.id);
      toast.success(t('deleted_success'));
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all(orgId) });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('delete_failed');
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const avatarColor = getAvatarColor(student.name);

  return (
    <TableRow className="group border-b border-border/40 transition-colors hover:bg-muted/30">
      <TableCell className="pl-5 text-xs font-mono text-muted-foreground/50 w-8">{index}</TableCell>
      <TableCell className="py-3">
        <Link href={`/students/${student.id}`} className="flex items-center gap-3">
          <Avatar className="size-9 rounded-xl shrink-0">
            <AvatarFallback className={cn('rounded-xl text-sm font-black', avatarColor)}>
              {(student.name || '?').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {student.name}
            </p>
            <p className="truncate text-[11px] font-mono text-muted-foreground">{student.phone}</p>
          </div>
        </Link>
      </TableCell>
      <TableCell>
        <span className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold',
          student.status === 'ACTIVE'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
        )}>
          <span className={cn('size-1.5 rounded-full', student.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400')} />
          {student.status === 'ACTIVE' ? t('status_active') : t('status_inactive')}
        </span>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground max-w-[160px]">
        <span className="truncate block">{student.parent || <span className="text-border">—</span>}</span>
      </TableCell>
      <TableCell className="max-w-[200px] text-xs text-muted-foreground">
        <div>
          <p className="truncate font-medium text-foreground/80">{student.groups.join(', ') || <span className="text-border">—</span>}</p>
          <p className="truncate text-[11px] text-muted-foreground/70">{student.courses.join(', ') || t('no_course')}</p>
        </div>
      </TableCell>
      <TableCell className="text-xs font-mono text-muted-foreground max-w-[160px]">
        <span className="truncate block">
          {teacherScoped ? student.teachers.join(', ') || '—' : student.phone}
        </span>
      </TableCell>
      {canManageScope && (
        <TableCell className="pr-4 text-right">
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <EditStudentModal
              student={student}
              trigger={
                <Button variant="ghost" size="icon" className="size-7 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10">
                  <PenLine className="size-3.5" />
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}

function TeacherPrompt() {
  const t = useTranslations('students');
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10">
        <BookOpen className="size-6 text-indigo-500" />
      </div>
      <p className="text-sm font-bold text-foreground">{t('select_teacher')}</p>
      <p className="mt-1.5 max-w-xs text-xs text-muted-foreground">
        {t('select_teacher_desc')}
      </p>
    </div>
  );
}

function EmptyState({ hasFilters, teacherScoped, onClear }: { hasFilters: boolean; teacherScoped: boolean; onClear: () => void }) {
  const t = useTranslations('students');
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted">
        <UsersRound className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-bold">{hasFilters ? t('no_matching_students') : t('no_students_yet')}</p>
      <p className="mt-1.5 max-w-xs text-xs text-muted-foreground">
        {teacherScoped ? t('enroll_first') : t('add_first')}
      </p>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onClear} className="mt-4 rounded-xl text-xs h-8">
          <X className="mr-1.5 size-3" /> Clear filters
        </Button>
      )}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10">
        <AlertCircle className="size-6 text-red-500" />
      </div>
      <p className="text-sm font-bold">Failed to load students</p>
      <p className="mt-1.5 text-xs text-muted-foreground">Check backend connection and try again.</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 rounded-xl text-xs h-8">
        <RefreshCw className="mr-1.5 size-3" /> Retry
      </Button>
    </div>
  );
}

function AccessDenied({ role }: { role?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-muted">
          <ShieldAlert className="size-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-black">Access Denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your role{role ? ` (${role})` : ''} cannot access the student roster.
        </p>
      </div>
    </div>
  );
}
