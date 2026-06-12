'use client';

import { useState } from 'react';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { useTranslations } from '@/i18n/index';
import { useUsers } from '@/hooks/useUsers';
import { UserRole } from '@/types/auth';
import { format } from 'date-fns';
import {
  MoreHorizontal,
  Mail,
  Phone,
  Shield,
  Search,
  RefreshCw,
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export function UsersTable() {
  const [page, setPage] = useState(1);
  const { value: search, debouncedValue: debouncedSearch, handleChange: setSearch, clearSearch, isPending: isSearching } = useDebounceSearch({
    delay: 300,
    onDebouncedChange: () => setPage(1),
  });
  const t = useTranslations('admin');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const pageSize = 10;

  const { data, isLoading, isError, refetch } = useUsers({
    page,
    limit: pageSize,
    search: debouncedSearch || undefined,
    role: roleFilter || undefined,
  });

  const items = data?.items ?? [];
  const meta = data?.meta;

  const clearFilters = () => {
    clearSearch();
    setRoleFilter('');
    setPage(1);
  };

  const getRoleBadge = (role: UserRole) => {
    const variants: Record<UserRole, string> = {
      ADMIN: 'bg-rose-50 text-rose-700 border-rose-200/50',
      MANAGER: 'bg-indigo-50 text-indigo-700 border-indigo-200/50',
      TEACHER: 'bg-teal-50 text-teal-700 border-teal-200/50',
      STUDENT: 'bg-amber-50 text-amber-700 border-amber-200/50',
      SUPER_ADMIN: 'bg-purple-50 text-purple-700 border-purple-200/50',
    };

    return (
      <Badge variant="outline" className={cn('font-medium capitalize', variants[role])}>
        {role.toLowerCase()}
      </Badge>
    );
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 rounded-xl border bg-card">
        <div className="size-12 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <AlertCircle className="size-5 text-destructive" />
        </div>
        <div className="text-center">
          <p className="font-medium text-sm">{t('users.load_failed')}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
            <RefreshCw className="mr-2 size-3.5" />
            {t('retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          {isSearching ? (
            <Loader2 className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-primary animate-spin pointer-events-none" />
          ) : (
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          )}
          <Input
            placeholder={t('users.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn('pl-8', search && 'pr-8')}
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
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as UserRole | '');
            setPage(1);
          }}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-ring transition-colors outline-none"
        >
          <option value="">{t('users.all_roles')}</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="TEACHER">Teacher</option>
          <option value="STUDENT">Student</option>
        </select>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          title={t('refresh')}
          className="size-9 shrink-0"
        >
          <RefreshCw className={cn('size-4', isLoading && 'animate-spin')} />
        </Button>
      </div>

      {/* ── Desktop View ── */}
      <div className="hidden md:block rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">{t('users.col_user')}</TableHead>
              <TableHead>{t('users.col_role')}</TableHead>
              <TableHead>{t('users.col_contact')}</TableHead>
              <TableHead>{t('users.col_joined')}</TableHead>
              <TableHead className="text-right pr-4">{t('users.col_actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-8 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-2 w-32" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="text-right pr-4"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Shield className="size-8 text-muted-foreground/50" />
                    <p className="text-sm font-medium">{t('users.none_found')}</p>
                    <p className="text-xs text-muted-foreground">
                      {search || roleFilter ? t('adjust_filters') : t('invite_first')}
                    </p>
                    {(search || roleFilter) && (
                      <Button variant="link" size="sm" onClick={clearFilters}>
                        {t('clear_filters')}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                          {user.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{user.full_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="size-3" /> {user.email}
                      </span>
                      {user.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="size-3" /> {user.phone}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(user.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" className="size-8" />
                        }
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>{t('users.view_details')}</DropdownMenuItem>
                        <DropdownMenuItem>{t('users.edit_permissions')}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Mobile View ── */}
      <div className="md:hidden space-y-3">
        {items.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{user.full_name}</p>
                  <div className="mt-1">{getRoleBadge(user.role)}</div>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Pagination ── */}
      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            {t('page_of', { page, pages: meta.pages })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page === meta.pages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
