'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from '@/i18n/index';
import { useAuthStore } from '@/store/auth.store';
import { usePermissions } from '@/hooks/usePermissions';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { useTeachers } from '@/hooks/useTeachers';
import { useGroupEnrollments, useStudentGroups, useStudents } from '@/hooks/useStudents';
import { studentService } from '@/services/students';
import { analyticsService } from '@/services/analytics';
import { paymentService } from '@/services/finance';
import { queryKeys } from '@/lib/api/query-keys';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BulkImportDialog } from '@/components/shared/BulkImportDialog';
import type { StudentStatus } from '@/types/student';
import { StudentsHero } from './StudentsHero';
import { StudentsFilters } from './StudentsFilters';
import { StudentTableRow } from './StudentTableRow';
import { AccessDenied, EmptyState, ErrorState, TeacherPrompt } from './StudentsStateViews';
import { DEFAULT_PAGE_SIZE, type PageSizeOption, type StudentRow, type ViewMode, type PaymentStatus } from './types';


export function StudentsWorkspace() {
  const t = useTranslations('students');
  const user = useAuthStore((state) => state.user);
  const { role, canManageStudents: canManageScope, teacherScoped, canReadStudents } = usePermissions();

  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(DEFAULT_PAGE_SIZE);
  const {
    value: search,
    debouncedValue: debouncedSearch,
    handleChange: setSearch,
    clearSearch,
    isPending: isSearching,
  } = useDebounceSearch({
    delay: 300,
    onDebouncedChange: () => setPage(1),
  });
  const [statusFilter, setStatusFilter] = useState<StudentStatus | ''>('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | ''>('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleBulkImport = async (data: Record<string, unknown>[]) => {
    const students = data.map((item) => ({
      name: String(item.name || '').trim(),
      phone: String(item.phone || '').trim(),
      address: String(item.address || '').trim(),
      parent: item.parent ? String(item.parent).trim() : undefined,
      parent_phone: item.parent_phone ? String(item.parent_phone).trim() : undefined,
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

  // Current-month payment status — any payment this month = paid.
  // currentMonth held in state so month rollover triggers re-render + auto-refetch via queryKey.
  const [currentMonth, setCurrentMonth] = useState(() => new Date().toISOString().slice(0, 7));

  // Tick every minute; if month changed, update state → queryKey changes → refetch.
  useEffect(() => {
    const id = setInterval(() => {
      const next = new Date().toISOString().slice(0, 7);
      if (next !== currentMonth) setCurrentMonth(next);
    }, 60 * 1000);
    return () => clearInterval(id);
  }, [currentMonth]);

  const monthStartIso = `${currentMonth}-01T00:00:00.000Z`;

  const paymentsQuery = useQuery({
    queryKey: ['students', 'payments', currentMonth, user?.organization_id],
    queryFn: () => paymentService.list({ from: monthStartIso, limit: 1000 }),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    enabled: canManageScope || teacherScoped,
    retry: false,
  });

  // Sum of payments per student in the current month.
  const paidByStudent = useMemo<Map<string, number>>(() => {
    const map = new Map<string, number>();
    (paymentsQuery.data?.items ?? []).forEach((p) => {
      if (!p.student_id) return;
      const amount = typeof p.amount === 'number' ? p.amount : parseFloat(String(p.amount) || '0') || 0;
      map.set(p.student_id, (map.get(p.student_id) ?? 0) + amount);
    });
    return map;
  }, [paymentsQuery.data]);

  // Derive { status, percent } from paid amount + expected monthly total per student.
  // expected = Σ (enrollment.monthly_fee - enrollment.discount_amount) across all enrollments.
  function deriveStatus(
    paid: number,
    expected: number,
    isLoading: boolean,
  ): { status: PaymentStatus; percent: number } {
    if (isLoading && paid === 0 && expected === 0) return { status: 'unknown', percent: 0 };
    if (expected <= 0) {
      // No fee configured — fall back to binary: any payment marks paid.
      return paid > 0 ? { status: 'paid', percent: 100 } : { status: 'unpaid', percent: 0 };
    }
    const pct = Math.min(100, Math.round((paid / expected) * 100));
    if (paid >= expected) return { status: 'paid', percent: 100 };
    if (paid > 0) return { status: 'partial', percent: pct };
    return { status: 'unpaid', percent: 0 };
  }

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
    const rows = new Map<string, StudentRow & { expected: number }>();
    enrollmentQueries.forEach((query) => {
      (query.data ?? []).forEach((enrollment) => {
        if (!enrollment.student) return;
        const groupName = enrollment.group?.name;
        const courseTitle = enrollment.group?.course?.title;
        const teacherName = enrollment.group?.teacher?.full_name;
        const fee = parseFloat(enrollment.monthly_fee ?? '0') || 0;
        const discount = parseFloat(enrollment.discount_amount ?? '0') || 0;
        const net = Math.max(0, fee - discount);
        const existing = rows.get(enrollment.student.id);
        if (existing) {
          if (groupName && !existing.groups.includes(groupName)) existing.groups.push(groupName);
          if (courseTitle && !existing.courses.includes(courseTitle)) existing.courses.push(courseTitle);
          if (teacherName && !existing.teachers.includes(teacherName)) existing.teachers.push(teacherName);
          existing.totalDiscount += discount;
          existing.expected += net;
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
          totalDiscount: discount,
          expected: net,
          paymentStatus: 'unknown',
          paymentPercent: 0,
        });
      });
    });
    // Resolve payment status using per-student expected + paid sums.
    rows.forEach((row, id) => {
      const paid = paidByStudent.get(id) ?? 0;
      const derived = deriveStatus(paid, row.expected, paymentsQuery.isLoading);
      row.paymentStatus = derived.status;
      row.paymentPercent = derived.percent;
    });
    const normalizedSearch = debouncedSearch.trim().toLowerCase();
    return Array.from(rows.values())
      // Strip the helper expected field before returning a StudentRow.
      .map(({ expected: _expected, ...row }) => row)
      .filter((student) => {
        const matchesSearch =
          !normalizedSearch ||
          student.name.toLowerCase().includes(normalizedSearch) ||
          student.phone.toLowerCase().includes(normalizedSearch);
        const matchesStatus = !statusFilter || student.status === statusFilter;
        const matchesPayment = !paymentFilter || student.paymentStatus === paymentFilter;
        return matchesSearch && matchesStatus && matchesPayment;
      });
  }, [enrollmentQueries, debouncedSearch, statusFilter, paymentFilter, paidByStudent, paymentsQuery.isLoading]);

  const allGroupIds = useMemo(() => (allGroupsQuery.data ?? []).map((g) => g.id), [allGroupsQuery.data]);
  const allEnrollmentQueries = useGroupEnrollments(allGroupIds, shouldLoadAllGroups && allGroupIds.length > 0);

  const allRows = useMemo<StudentRow[]>(() => {
    const enrollmentMap = new Map<
      string,
      { groups: string[]; courses: string[]; teachers: string[]; totalDiscount: number; expected: number }
    >();
    allEnrollmentQueries.forEach((query) => {
      (query.data ?? []).forEach((enrollment) => {
        if (!enrollment.student) return;
        const existing = enrollmentMap.get(enrollment.student.id);
        const groupName = enrollment.group?.name;
        const courseTitle = enrollment.group?.course?.title;
        const teacherName = enrollment.group?.teacher?.full_name;
        const fee = parseFloat(enrollment.monthly_fee ?? '0') || 0;
        const discount = parseFloat(enrollment.discount_amount ?? '0') || 0;
        const net = Math.max(0, fee - discount);
        if (existing) {
          if (groupName && !existing.groups.includes(groupName)) existing.groups.push(groupName);
          if (courseTitle && !existing.courses.includes(courseTitle)) existing.courses.push(courseTitle);
          if (teacherName && !existing.teachers.includes(teacherName)) existing.teachers.push(teacherName);
          existing.totalDiscount += discount;
          existing.expected += net;
        } else {
          enrollmentMap.set(enrollment.student.id, {
            groups: groupName ? [groupName] : [],
            courses: courseTitle ? [courseTitle] : [],
            teachers: teacherName ? [teacherName] : [],
            totalDiscount: discount,
            expected: net,
          });
        }
      });
    });
    return (studentsQuery.data?.items ?? [])
      .map((student) => {
        const info = enrollmentMap.get(student.id);
        const paid = paidByStudent.get(student.id) ?? 0;
        const expected = info?.expected ?? 0;
        const derived = deriveStatus(paid, expected, paymentsQuery.isLoading);
        return {
          ...student,
          groups: info?.groups ?? [],
          courses: info?.courses ?? [],
          teachers: info?.teachers ?? [],
          totalDiscount: info?.totalDiscount ?? 0,
          paymentStatus: derived.status,
          paymentPercent: derived.percent,
        };
      })
      .filter((student) => !paymentFilter || student.paymentStatus === paymentFilter);
  }, [studentsQuery.data?.items, allEnrollmentQueries, paidByStudent, paymentFilter, paymentsQuery.isLoading]);

  const rows = effectiveViewMode === 'all' ? allRows : teacherRows;
  const loading =
    effectiveViewMode === 'all'
      ? studentsQuery.isLoading
      : groupsQuery.isLoading || enrollmentQueries.some((q) => q.isLoading);
  const isError =
    effectiveViewMode === 'all' ? studentsQuery.isError : groupsQuery.isError || enrollmentQueries.some((q) => q.isError);
  const totalCount = effectiveViewMode === 'all' ? (studentsQuery.data?.meta.total ?? 0) : rows.length;
  const teacherOptions = teachersQuery.data?.items ?? [];
  const activeCount = rows.filter((s) => s.status === 'ACTIVE').length;
  const inactiveCount = rows.filter((s) => s.status === 'INACTIVE').length;
  const activeRatio = rows.length > 0 ? Math.round((activeCount / rows.length) * 100) : 0;
  const groupCount = new Set(rows.flatMap((s) => s.groups)).size;

  const resetFilters = () => {
    clearSearch();
    setStatusFilter('');
    setPaymentFilter('');
    setPage(1);
  };

  const refresh = () => {
    if (effectiveViewMode === 'all') {
      studentsQuery.refetch();
      return;
    }
    groupsQuery.refetch();
    enrollmentQueries.forEach((q) => q.refetch());
  };

  if (!canReadStudents) return <AccessDenied role={role} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <StudentsHero
        totalCount={totalCount}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
        groupCount={groupCount}
        rowsLength={rows.length}
        activeRatio={activeRatio}
        teacherScoped={teacherScoped}
        canManageScope={canManageScope}
        onImportClick={() => setIsImportOpen(true)}
      />

      <StudentsFilters
        search={search}
        isSearching={isSearching}
        onSearchChange={setSearch}
        onClearSearch={clearSearch}
        statusFilter={statusFilter}
        onStatusChange={(s) => {
          setStatusFilter(s);
          setPage(1);
        }}
        paymentFilter={paymentFilter}
        onPaymentFilterChange={(p) => {
          setPaymentFilter(p);
          setPage(1);
        }}
        effectiveViewMode={effectiveViewMode}
        onViewModeChange={(v) => {
          setViewMode(v);
          setPage(1);
        }}
        selectedTeacherId={selectedTeacherId}
        onTeacherChange={(id) => {
          setSelectedTeacherId(id);
          setPage(1);
        }}
        teacherOptions={teacherOptions}
        canManageScope={canManageScope}
        viewMode={viewMode}
        pageSize={pageSize}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
          <div>
            <p className="text-sm font-bold text-foreground">{t('student_roster')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {effectiveViewMode === 'all'
                ? `${studentsQuery.data?.meta.total ?? rows.length} ${t('students_total')}`
                : `${rows.length} ${t('students_from_teacher')}`}
            </p>
          </div>
          {(search || statusFilter || paymentFilter) && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-lg border border-border/60 px-2.5 py-1.5"
            >
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
          <EmptyState
            hasFilters={!!(search || statusFilter)}
            onClear={resetFilters}
            teacherScoped={effectiveViewMode === 'teacher'}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/50">
                <TableHead className="w-8 pl-5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('col_number')}
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('col_student')}
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('col_status')}
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('col_payment')} · {currentMonth}
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {teacherScoped ? t('col_group_course') : t('col_group_course')}
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {teacherScoped ? t('col_teacher') : t('col_phone')}
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('discount')}
                </TableHead>
                {canManageScope && (
                  <TableHead className="w-20 pr-4 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t('col_actions')}
                  </TableHead>
                )}
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
              <span className="font-bold text-foreground">{studentsQuery.data.meta.total}</span>{' '}
              {t('col_student').toLowerCase()}
            </p>
            <nav aria-label="Pagination" className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous page"
                className="size-9 rounded-lg"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft aria-hidden="true" className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next page"
                className="size-9 rounded-lg"
                disabled={page >= studentsQuery.data.meta.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight aria-hidden="true" className="size-3.5" />
              </Button>
            </nav>
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
        columnMapping={{ 'Full Name': 'name', Phone: 'phone', Address: 'address', 'Parent Name': 'parent' }}
      />
    </div>
  );
}
