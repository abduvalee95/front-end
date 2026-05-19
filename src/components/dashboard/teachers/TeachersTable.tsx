'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from '@/i18n/index';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { useTeachers, useDeletedTeachers, useToggleTeacherStatus } from '@/hooks/useTeachers';
import type { TeacherProfile, TeacherStatus } from '@/types/teacher';
import { useAuthStore } from '@/store/auth.store';
import { format } from 'date-fns';
import {
  MoreHorizontal,
  Pencil,
  Power,
  Search,
  RefreshCw,
  GraduationCap,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Eye,
  Trash2,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TeacherStatusBadge } from './TeacherStatusBadge';
import { TeacherStatusConfirmDialog } from './TeacherStatusConfirmDialog';

const COL_COUNT = 5;

interface TeachersTableProps {
  onEditClick: (teacher: TeacherProfile) => void;
  onViewClick: (teacher: TeacherProfile) => void;
  onDeleteClick: (teacher: TeacherProfile) => void;
}

export default function TeachersTable({
  onEditClick,
  onViewClick,
  onDeleteClick,
}: TeachersTableProps) {
  const t = useTranslations('teachers');
  const tCommon = useTranslations('common');
  const [page, setPage] = useState(1);
  const { value: search, debouncedValue: debouncedSearch, handleChange: setSearch, clearSearch, isPending: isSearching } = useDebounceSearch({
    delay: 300,
    onDebouncedChange: () => setPage(1),
  });
  const [statusFilter, setStatusFilter] = useState<TeacherStatus | ''>('ACTIVE');
  const pageSize = 10;

  const isSuperAdmin = useAuthStore((state) => state.user?.role === 'SUPER_ADMIN');
  const isDeletedView = statusFilter === 'DELETED';

  const normalQuery = useTeachers({
    page,
    limit: pageSize,
    search: debouncedSearch || undefined,
    status: (statusFilter && !isDeletedView) ? statusFilter : undefined,
  }, !isDeletedView);

  const deletedQuery = useDeletedTeachers({
    page,
    limit: pageSize,
    search: debouncedSearch || undefined,
  }, isDeletedView);

  const { data, isLoading, isError, refetch } = isDeletedView ? deletedQuery : normalQuery;

  const toggleStatus = useToggleTeacherStatus();
  const [statusTarget, setStatusTarget] = useState<TeacherProfile | null>(null);

  const handleStatusConfirm = useCallback(() => {
    if (!statusTarget) return;
    const newStatus: TeacherStatus =
      statusTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    toggleStatus.mutate(
      { id: statusTarget.id, status: newStatus },
      { onSettled: () => setStatusTarget(null) },
    );
  }, [statusTarget, toggleStatus]);

  const items = data?.items ?? [];
  const meta = data?.meta;

  const clearFilters = () => { clearSearch(); setStatusFilter(isDeletedView ? 'DELETED' : 'ACTIVE'); setPage(1); };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 rounded-xl border bg-card">
        <div className="size-12 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <AlertCircle className="size-5 text-destructive" />
        </div>
        <div className="text-center">
          <p className="font-medium text-sm">{tCommon('failed_load_teachers')}</p>
          <p className="text-muted-foreground text-xs mt-1">{tCommon('check_connection')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 size-3.5" />
          {tCommon('try_again')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            {isSearching ? (
              <Loader2 className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-primary animate-spin pointer-events-none" />
            ) : (
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            )}
            <Input
              placeholder={`${tCommon('search')} ${t('full_name')}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-8${search ? ' pr-8' : ''}`}
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
            onChange={(e) => { setStatusFilter(e.target.value as TeacherStatus | ''); setPage(1); }}
            className="h-8 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-colors"
          >
            <option value="">{tCommon('all_statuses')}</option>
            <option value="ACTIVE">{t('status_active')}</option>
            <option value="INACTIVE">{t('status_inactive')}</option>
            <option value="ON_LEAVE">{t('status_on_leave')}</option>
            {isSuperAdmin && <option value="DELETED">{tCommon('deleted')}</option>}
          </select>

          <Button variant="ghost" size="icon" onClick={() => refetch()} title={tCommon('refresh')} className="size-8 shrink-0">
            <RefreshCw className="size-4" />
          </Button>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">{tCommon('teacher')}</TableHead>
                <TableHead>{tCommon('status')}</TableHead>
                <TableHead>{t('phone')}</TableHead>
                <TableHead>{tCommon('subjects')}</TableHead>
                <TableHead>{isDeletedView ? tCommon('deleted_on') : tCommon('joined')}</TableHead>
                <TableHead className="text-right pr-4">{tCommon('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [0,1,2,3,4].map((i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-8 rounded-lg shrink-0 bg-indigo-100/50 dark:bg-indigo-950/30" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-32 bg-indigo-100/50 dark:bg-indigo-950/30" />
                          <Skeleton className="h-3 w-24 bg-indigo-100/50 dark:bg-indigo-950/30" />
                        </div>
                      </div>
                    </TableCell>
                    {[0,1,2,3].map((j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20 bg-indigo-100/50 dark:bg-indigo-950/30" /></TableCell>
                    ))}
                    <TableCell />
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COL_COUNT + 1} className="py-24 text-center">
                    <EmptyState
                      hasFilters={isDeletedView ? !!search : !!(search || statusFilter !== 'ACTIVE')}
                      onClear={isDeletedView ? clearSearch : clearFilters}
                      emptyMessage={isDeletedView ? t('no_deleted') : undefined}
                      emptyDescription={isDeletedView ? t('no_deleted_desc') : undefined}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((teacher) => (
                  <TableRow
                    key={teacher.id}
                    className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                  >
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs font-semibold edu-gradient-avatar">
                            {teacher.full_name?.charAt(0).toUpperCase() || 'T'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{teacher.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{teacher.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TeacherStatusBadge status={teacher.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {teacher.phone || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-[200px]">
                      {teacher.subjects?.join(', ') || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground" suppressHydrationWarning>
                      {isDeletedView && teacher.deleted_at
                        ? format(new Date(teacher.deleted_at), 'MMM d, yyyy')
                        : format(new Date(teacher.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      {isDeletedView ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg hover:bg-slate-100"
                          onClick={() => onViewClick(teacher)}
                          aria-label="View"
                        >
                          <Eye className="size-4 text-slate-500" />
                        </Button>
                      ) : (
                        <TeacherActionsMenu
                          teacher={teacher}
                          onView={() => onViewClick(teacher)}
                          onEdit={() => onEditClick(teacher)}
                          onToggleStatus={() => setStatusTarget(teacher)}
                          onDelete={() => onDeleteClick(teacher)}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile card stack */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            [0,1,2,3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-10 rounded-lg bg-indigo-100/50 dark:bg-indigo-950/30" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28 bg-indigo-100/50 dark:bg-indigo-950/30" />
                        <Skeleton className="h-3 w-16 bg-indigo-100/50 dark:bg-indigo-950/30" />
                      </div>
                    </div>
                    <Skeleton className="size-8 rounded-md bg-indigo-100/50 dark:bg-indigo-950/30" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : items.length === 0 ? (
            <EmptyState
              hasFilters={isDeletedView ? !!search : !!(search || statusFilter !== 'ACTIVE')}
              onClear={isDeletedView ? clearSearch : clearFilters}
              emptyMessage={isDeletedView ? t('no_deleted') : undefined}
              emptyDescription={isDeletedView ? t('no_deleted_desc') : undefined}
            />
          ) : (
            items.map((teacher) => (
              <Card
                key={teacher.id}
                className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                onClick={() => onViewClick(teacher)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="size-10 shrink-0">
                        <AvatarFallback className="text-sm font-semibold edu-gradient-avatar">
                          {teacher.full_name?.charAt(0).toUpperCase() || 'T'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{teacher.full_name}</p>
                        <TeacherStatusBadge status={teacher.status} />
                      </div>
                    </div>
                    {!isDeletedView && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <TeacherActionsMenu
                          teacher={teacher}
                          onView={() => onViewClick(teacher)}
                          onEdit={() => onEditClick(teacher)}
                          onToggleStatus={() => setStatusTarget(teacher)}
                          onDelete={() => onDeleteClick(teacher)}
                        />
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {isDeletedView && teacher.deleted_at
                      ? `${tCommon('deleted_on')} ${format(new Date(teacher.deleted_at), 'MMM d, yyyy')}`
                      : `${t('joined')} ${format(new Date(teacher.created_at), 'MMM d, yyyy')}`
                    } · {teacher.subjects?.join(', ') || t('no_subjects')}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {meta && meta.pages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              {t('pagination_page')} <span className="font-medium text-foreground">{page}</span> {t('pagination_of')}{' '}
              <span className="font-medium text-foreground">{meta.pages}</span> ·{' '}
              <span className="font-medium text-foreground">{meta.total}</span> {t('pagination_total')}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={page >= meta.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <TeacherStatusConfirmDialog
        teacher={statusTarget}
        isLoading={toggleStatus.isPending}
        onConfirm={handleStatusConfirm}
        onCancel={() => setStatusTarget(null)}
      />
    </>
  );
}

function TeacherActionsMenu({
  teacher,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  teacher: TeacherProfile;
  onView: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const tMenu = useTranslations('teachers');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-slate-100" aria-label="Actions">
          <MoreHorizontal className="size-4 text-slate-500" />
        </Button>
      } />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onView}>
          <Eye className="mr-2 size-4" />
          {tMenu('view_profile')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="mr-2 size-4" />
          {tMenu('edit_profile')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onToggleStatus}
          className={teacher.status === 'ACTIVE' ? 'text-amber-600 focus:text-amber-600' : 'text-teal-600 focus:text-teal-600'}
        >
          <Power className="mr-2 size-4" />
          {teacher.status === 'ACTIVE' ? tMenu('deactivate') : tMenu('activate')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 size-4" />
          {tMenu('delete_teacher')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmptyState({
  hasFilters,
  onClear,
  emptyMessage = 'No teachers yet',
  emptyDescription = 'Teachers will appear here once they are invited and their profiles are created.',
}: {
  hasFilters: boolean;
  onClear: () => void;
  emptyMessage?: string;
  emptyDescription?: string;
}) {
  const tT = useTranslations('teachers');
  const tC = useTranslations('common');
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
        <GraduationCap className="h-8 w-8 text-indigo-500" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold">
          {hasFilters ? tT('no_teachers_found') : (emptyMessage ?? tT('no_teachers'))}
        </h3>
        <p className="text-muted-foreground text-sm mt-1 text-center max-w-sm">
          {hasFilters
            ? tC('adjust_filters')
            : (emptyDescription ?? tT('no_teachers_desc'))}
        </p>
      </div>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onClear}>{tC('clear_filters')}</Button>
      )}
    </div>
  );
}
