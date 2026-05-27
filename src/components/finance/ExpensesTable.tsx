'use client';

import { Loader2, ShoppingBag, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslations } from '@/i18n/index';
import { cn } from '@/lib/utils';
import type { Expense } from '@/types/finance';
import { CATEGORY_COLORS, formatAmount, formatDate } from './utils';

interface ExpensesTableProps {
  expenses: Expense[];
  isLoading: boolean;
  onAddExpense: () => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function ExpensesTable({ expenses, isLoading, onAddExpense, onDelete, isDeleting }: ExpensesTableProps) {
  const t = useTranslations('finance');
  const tCommon = useTranslations('common');

  const emptyState = (
    <div className="flex flex-col items-center gap-3 py-14">
      <div className="size-12 rounded-2xl bg-rose-500/10 flex items-center justify-center">
        <ShoppingBag className="size-5 text-rose-500" />
      </div>
      <p className="text-[13px] font-semibold text-muted-foreground/70">No expenses yet</p>
      <button
        onClick={onAddExpense}
        className="text-[12px] font-bold text-rose-600 hover:text-rose-700 underline-offset-2 hover:underline"
      >
        Add first expense
      </button>
    </div>
  );

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
      {/* ── Mobile card list ── */}
      <div className="md:hidden divide-y divide-border/30">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))
        ) : expenses.length === 0 ? (
          emptyState
        ) : (
          expenses.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-3 hover:bg-rose-500/[0.03] transition-colors group">
              {/* Primary: description + category */}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-[13px] font-semibold text-foreground truncate">
                  {e.description ?? e.category}
                </p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      'rounded-full text-[10px] px-2 py-0 h-4 font-semibold border',
                      CATEGORY_COLORS[e.category] ?? CATEGORY_COLORS.OTHER,
                    )}
                  >
                    {e.category}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground/55 tabular-nums">
                    {formatDate(e.paid_at)}
                  </span>
                </div>
              </div>
              {/* Primary: amount + delete */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[14px] font-black text-rose-600 dark:text-rose-400 tabular-nums">
                  -{formatAmount(e.amount)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-lg opacity-0 group-hover:opacity-100 text-destructive/40 hover:text-destructive hover:bg-destructive/8 transition-all"
                  onClick={() => onDelete(e.id)}
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3.5" />}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/40">
              <TableHead className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50 py-3 pl-4">
                {tCommon('description')}
              </TableHead>
              <TableHead className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50 text-right pr-4">
                {t('amount')}
              </TableHead>
              <TableHead className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50">
                {tCommon('date')}
              </TableHead>
              <TableHead className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50">
                {tCommon('category')}
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="border-b border-border/30">
                  <TableCell className="pl-4"><Skeleton className="h-3.5 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-3.5 w-24 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-3.5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  {emptyState}
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((e) => (
                <TableRow key={e.id} className="group border-b border-border/30 hover:bg-rose-500/[0.03] transition-colors">
                  <TableCell className="py-3 pl-4 max-w-[220px] truncate text-[11.5px] text-muted-foreground/65">
                    {e.description ?? '—'}
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <span className="text-[13px] font-black text-rose-600 dark:text-rose-400 tabular-nums">
                      -{formatAmount(e.amount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[11.5px] tabular-nums font-medium text-muted-foreground/60">
                      {formatDate(e.paid_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        'rounded-full text-[10.5px] px-2.5 py-0.5 font-semibold border',
                        CATEGORY_COLORS[e.category] ?? CATEGORY_COLORS.OTHER,
                      )}
                    >
                      {e.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-lg opacity-0 group-hover:opacity-100 text-destructive/40 hover:text-destructive hover:bg-destructive/8 transition-all"
                      onClick={() => onDelete(e.id)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3.5" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
