'use client';

import { useState, useCallback } from 'react';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { useTranslations, useLocale } from '@/i18n/index';
import { useOrganizations, useToggleOrganizationStatus } from '@/hooks/useOrganizations';
import type { PlatformOrganization, OrganizationStatus } from '@/types/platform';
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Power,
  Plus,
  Search,
  RefreshCw,
  Building2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
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
import { OrganizationStatusBadge } from './OrganizationStatusBadge';
import { StatusConfirmDialog } from './StatusConfirmDialog';
import { PAGE_SIZE_DEFAULT } from '@/lib/constants';

const COL_COUNT = 5;

interface OrganizationsTableProps {
  onCreateClick: () => void;
  onEditClick: (org: PlatformOrganization) => void;
  onDetailClick: (org: PlatformOrganization) => void;
}

export default function OrganizationsTable({
  onCreateClick,
  onEditClick,
  onDetailClick,
}: OrganizationsTableProps) {
  const [page, setPage] = useState(1);
  const { value: search, debouncedValue: debouncedSearch, handleChange: setSearch, clearSearch, isPending: isSearching } = useDebounceSearch({
    delay: 300,
    onDebouncedChange: () => setPage(1),
  });
  const t = useTranslations('admin');
  const locale = useLocale();
  const [statusFilter, setStatusFilter] = useState<OrganizationStatus | ''>('');
  const pageSize = PAGE_SIZE_DEFAULT;

  const { data, isLoading, isError, refetch } = useOrganizations({
    page,
    limit: pageSize,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
  });

  const toggleStatus = useToggleOrganizationStatus();
  const [statusTarget, setStatusTarget] = useState<PlatformOrganization | null>(null);

  const handleStatusConfirm = useCallback(() => {
    if (!statusTarget) return;
    const newStatus: OrganizationStatus =
      statusTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    toggleStatus.mutate(
      { id: statusTarget.id, status: newStatus },
      { onSettled: () => setStatusTarget(null) },
    );
  }, [statusTarget, toggleStatus]);

  const items = data?.items ?? [];
  const meta = data?.meta;

  const clearFilters = () => { clearSearch(); setStatusFilter(''); setPage(1); };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 rounded-xl border bg-card">
        <div className="size-12 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <AlertCircle className="size-5 text-destructive" />
        </div>
        <div className="text-center">
          <p className="font-medium text-sm">{t('orgs.load_failed')}</p>
          <p className="text-muted-foreground text-xs mt-1">{t('check_connection')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 size-3.5" />
          {t('retry')}
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
              placeholder={t('orgs.search')}
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
            onChange={(e) => { setStatusFilter(e.target.value as OrganizationStatus | ''); setPage(1); }}
            className="h-8 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-colors"
          >
            <option value="">{t('orgs.all_statuses')}</option>
            <option value="ACTIVE">{t('active')}</option>
            <option value="INACTIVE">{t('inactive')}</option>
          </select>

          <Button variant="ghost" size="icon" onClick={() => refetch()} title={t('refresh')} className="size-8 shrink-0">
            <RefreshCw className="size-4" />
          </Button>

          <div className="sm:ml-auto">
            <Button size="sm" onClick={onCreateClick} className="edu-gradient-btn rounded-lg h-8 w-full sm:w-auto">
              <Plus className="mr-1.5 size-4" />
              {t('orgs.create')}
            </Button>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">{t('orgs.col_org')}</TableHead>
                <TableHead>{t('orgs.col_status')}</TableHead>
                <TableHead>{t('orgs.col_phone')}</TableHead>
                <TableHead>{t('orgs.col_users')}</TableHead>
                <TableHead>{t('orgs.col_created')}</TableHead>
                <TableHead className="text-right pr-4">{t('orgs.col_actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [0,1,2,3,4].map((i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-8 rounded-lg shrink-0 bg-primary-muted/50 dark:bg-primary-muted/30" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-32 bg-primary-muted/50 dark:bg-primary-muted/30" />
                          <Skeleton className="h-3 w-24 bg-primary-muted/50 dark:bg-primary-muted/30" />
                        </div>
                      </div>
                    </TableCell>
                    {[0,1,2,3].map((j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20 bg-primary-muted/50 dark:bg-primary-muted/30" /></TableCell>
                    ))}
                    <TableCell />
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COL_COUNT + 1} className="py-24 text-center">
                    <EmptyState
                      hasFilters={!!(search || statusFilter)}
                      onClear={clearFilters}
                      onCreateClick={onCreateClick}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((org) => (
                  <TableRow
                    key={org.id}
                    className="hover:bg-primary-muted/50 dark:hover:bg-primary-muted/20 transition-colors cursor-pointer"
                    onClick={() => onDetailClick(org)}
                  >
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs font-semibold edu-gradient-avatar">
                            {org.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{org.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{org.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <OrganizationStatusBadge status={org.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {org.phone || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {org.usersCount}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(org.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      <OrgActionsMenu
                        org={org}
                        onView={() => onDetailClick(org)}
                        onEdit={() => onEditClick(org)}
                        onToggleStatus={() => setStatusTarget(org)}
                      />
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
                      <Skeleton className="size-10 rounded-lg bg-primary-muted/50 dark:bg-primary-muted/30" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28 bg-primary-muted/50 dark:bg-primary-muted/30" />
                        <Skeleton className="h-3 w-16 bg-primary-muted/50 dark:bg-primary-muted/30" />
                      </div>
                    </div>
                    <Skeleton className="size-8 rounded-md bg-primary-muted/50 dark:bg-primary-muted/30" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : items.length === 0 ? (
            <EmptyState
              hasFilters={!!(search || statusFilter)}
              onClear={clearFilters}
              onCreateClick={onCreateClick}
            />
          ) : (
            items.map((org) => (
              <Card key={org.id} className="cursor-pointer hover:bg-primary-muted/50 dark:hover:bg-primary-muted/20 transition-colors" onClick={() => onDetailClick(org)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="size-10 shrink-0">
                        <AvatarFallback className="text-sm font-semibold edu-gradient-avatar">
                          {org.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{org.name}</p>
                        <OrganizationStatusBadge status={org.status} />
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <OrgActionsMenu
                        org={org}
                        onView={() => onDetailClick(org)}
                        onEdit={() => onEditClick(org)}
                        onToggleStatus={() => setStatusTarget(org)}
                      />
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {t('orgs_created_line', { date: new Date(org.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }), count: org.usersCount })}
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
              {t('showing_page', { page, pages: meta.pages, total: meta.total })}
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

      <StatusConfirmDialog
        org={statusTarget}
        isLoading={toggleStatus.isPending}
        onConfirm={handleStatusConfirm}
        onCancel={() => setStatusTarget(null)}
      />
    </>
  );
}

function OrgActionsMenu({
  org,
  onView,
  onEdit,
  onToggleStatus,
}: {
  org: PlatformOrganization;
  onView: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
}) {
  const t = useTranslations('admin');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="size-8" aria-label="Actions" />
        }
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onView}>
          <Eye className="mr-2 size-4" />
          {t('view')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="mr-2 size-4" />
          {t('edit')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onToggleStatus}
          className={org.status === 'ACTIVE' ? 'text-destructive focus:text-destructive' : ''}
        >
          <Power className="mr-2 size-4" />
          {org.status === 'ACTIVE' ? t('deactivate') : t('activate')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmptyState({
  hasFilters,
  onClear,
  onCreateClick,
}: {
  hasFilters: boolean;
  onClear: () => void;
  onCreateClick: () => void;
}) {
  const t = useTranslations('admin');
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="h-16 w-16 rounded-2xl edu-gradient-primary flex items-center justify-center mb-4">
        <Building2 className="h-8 w-8 text-white" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold">
          {hasFilters ? t('orgs.none_found') : t('orgs_none_yet')}
        </h3>
        <p className="text-muted-foreground text-sm mt-1 text-center max-w-sm">
          {hasFilters ? t('adjust_filters') : t('orgs_create_first')}
        </p>
      </div>
      {hasFilters ? (
        <Button variant="outline" size="sm" onClick={onClear}>{t('clear_filters')}</Button>
      ) : (
        <Button className="edu-gradient-btn mt-4" onClick={onCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          {t('orgs.create')}
        </Button>
      )}
    </div>
  );
}
