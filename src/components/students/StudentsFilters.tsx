'use client';

import { Loader2, Rows3, Search, UsersRound, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslations } from '@/i18n/index';
import { cn } from '@/lib/utils';
import type { StudentStatus } from '@/types/student';
import type { ViewMode, PaymentStatus, PageSizeOption } from './types';
import { PAGE_SIZE_OPTIONS } from './types';

interface TeacherOption {
  id: string;
  full_name?: string;
}

interface StudentsFiltersProps {
  search: string;
  isSearching: boolean;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  statusFilter: StudentStatus | '';
  onStatusChange: (status: StudentStatus | '') => void;
  paymentFilter: PaymentStatus | '';
  onPaymentFilterChange: (status: PaymentStatus | '') => void;
  effectiveViewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedTeacherId: string;
  onTeacherChange: (id: string) => void;
  teacherOptions: TeacherOption[];
  canManageScope: boolean;
  viewMode: ViewMode;
  pageSize: PageSizeOption;
  onPageSizeChange: (size: PageSizeOption) => void;
}

export function StudentsFilters({
  search,
  isSearching,
  onSearchChange,
  onClearSearch,
  statusFilter,
  onStatusChange,
  paymentFilter,
  onPaymentFilterChange,
  effectiveViewMode,
  onViewModeChange,
  selectedTeacherId,
  onTeacherChange,
  teacherOptions,
  canManageScope,
  viewMode,
  pageSize,
  onPageSizeChange,
}: StudentsFiltersProps) {
  const t = useTranslations('students');
  const tCommon = useTranslations('common');

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border/60 bg-background/80 px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          {isSearching ? (
            <Loader2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 animate-spin text-primary" />
          ) : (
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          )}
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`${tCommon('search')} ${t('full_name')} ${tCommon('or')} ${t('phone')}…`}
            aria-label={`${tCommon('search')} ${t('full_name')} ${tCommon('or')} ${t('phone')}`}
            className={cn('h-9 pl-8 text-sm rounded-xl', search && 'pr-8')}
          />
          {search && (
            <button
              type="button"
              onClick={onClearSearch}
              aria-label={tCommon('clear') ?? 'Clear'}
              className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex size-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X aria-hidden="true" className="size-3.5" />
            </button>
          )}
        </div>

        {/* Status pills */}
        <div className="flex rounded-xl border border-border/60 bg-muted/40 p-0.5">
          {(
            [
              ['', t('all')],
              ['ACTIVE', t('status_active')],
              ['INACTIVE', t('status_inactive')],
            ] as [string, string][]
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => onStatusChange(val as StudentStatus | '')}
              className={cn(
                'h-7 rounded-lg px-3 text-xs font-semibold transition-all',
                statusFilter === val
                  ? val === 'ACTIVE'
                    ? 'bg-success text-white shadow-sm'
                    : val === 'INACTIVE'
                      ? 'bg-muted text-white shadow-sm'
                      : 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Payment filter pills */}
        <div className="flex rounded-xl border border-border/60 bg-muted/40 p-0.5">
          {(
            [
              { val: '', label: t('pay_filter_all'), activeClass: 'bg-background text-foreground shadow-sm' },
              { val: 'paid', label: t('pay_paid'), activeClass: 'bg-success text-white shadow-sm' },
              { val: 'partial', label: t('pay_partial'), activeClass: 'bg-warning text-white shadow-sm' },
              { val: 'unpaid', label: t('pay_unpaid'), activeClass: 'bg-danger text-white shadow-sm' },
            ]
          ).map(({ val, label, activeClass }) => (
            <button
              key={val}
              type="button"
              onClick={() => onPaymentFilterChange(val as PaymentStatus | '')}
              className={cn(
                'h-7 rounded-lg px-3 text-xs font-semibold transition-all',
                paymentFilter === val
                  ? activeClass
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Per-page selector */}
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v) as PageSizeOption)}
        >
          <SelectTrigger
            className="h-9 w-auto min-w-[110px] rounded-xl text-xs font-medium cursor-pointer gap-1.5"
            aria-label={tCommon('rows_per_page') ?? 'Rows per page'}
          >
            <Rows3 className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)} className="text-xs cursor-pointer">
                {size} {tCommon('per_page')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Teacher filter — only visible in teacher view mode */}
        {canManageScope && effectiveViewMode === 'teacher' && (
          <Select
            value={selectedTeacherId || '_all_'}
            onValueChange={(v) => onTeacherChange(v === '_all_' ? '' : (v ?? ''))}
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
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.full_name ?? t('unnamed')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* View mode toggle */}
        {canManageScope && (
          <div className="flex rounded-xl border border-border/60 bg-muted/40 p-0.5">
            {(
              [
                ['all', t('all')],
                ['teacher', t('by_teacher')],
              ] as [ViewMode, string][]
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => onViewModeChange(val)}
                className={cn(
                  'h-7 rounded-lg px-3 text-xs font-semibold transition-all',
                  viewMode === val
                    ? 'bg-card text-white shadow-sm dark:bg-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
