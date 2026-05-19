'use client';

import { useState } from 'react';
import { useTranslations } from '@/i18n/index';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Trash2,
  Loader2,
  CreditCard,
  Banknote,
  ArrowLeftRight,
  ReceiptText,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  usePayments,
  useExpenses,
  useFinanceSummary,
  useDeletePayment,
  useDeleteExpense,
} from '@/hooks/useFinance';
import { AddPaymentModal } from './AddPaymentModal';
import { AddExpenseModal } from './AddExpenseModal';
import type { Payment, Expense, PaymentMethod } from '@/types/finance';

// Method labels are translated dynamically in component
const METHOD_CONFIG: Record<PaymentMethod, { label: string; icon: React.ReactNode; className: string }> = {
  CASH: {
    label: 'Cash',
    icon: <Banknote className="size-3" />,
    className: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800',
  },
  CARD: {
    label: 'Card',
    icon: <CreditCard className="size-3" />,
    className: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800',
  },
  TRANSFER: {
    label: 'Transfer',
    icon: <ArrowLeftRight className="size-3" />,
    className: 'bg-violet-500/10 text-violet-700 border-violet-200 dark:text-violet-400 dark:border-violet-800',
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  RENT: 'bg-orange-500/10 text-orange-700 border-orange-200 dark:text-orange-400 dark:border-orange-800',
  SALARY: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800',
  UTILITIES: 'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:text-yellow-400 dark:border-yellow-800',
  MARKETING: 'bg-pink-500/10 text-pink-700 border-pink-200 dark:text-pink-400 dark:border-pink-800',
  SUPPLIES: 'bg-teal-500/10 text-teal-700 border-teal-200 dark:text-teal-400 dark:border-teal-800',
  EQUIPMENT: 'bg-indigo-500/10 text-indigo-700 border-indigo-200 dark:text-indigo-400 dark:border-indigo-800',
  OTHER: 'bg-muted text-muted-foreground',
};

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ky-KG').format(amount) + ' KGS';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const STAT_CONFIG = {
  income: {
    grad: 'from-emerald-500 to-teal-400',
    iconBg: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
    amount: 'text-emerald-600 dark:text-emerald-400',
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
  expense: {
    grad: 'from-rose-500 to-pink-400',
    iconBg: 'bg-rose-500/12 text-rose-600 dark:text-rose-400',
    amount: 'text-rose-600 dark:text-rose-400',
    bar: 'bg-rose-500',
    badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
  },
  profit: {
    grad: 'from-blue-500 to-indigo-400',
    iconBg: 'bg-blue-500/12 text-blue-600 dark:text-blue-400',
    amount: 'text-blue-600 dark:text-blue-400',
    bar: 'bg-blue-500',
    badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  },
} as const;

function StatCard({
  label,
  value,
  icon,
  type,
  sub,
  barRatio,
}: {
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
  type: keyof typeof STAT_CONFIG;
  sub?: string;
  barRatio?: number;
}) {
  const c = STAT_CONFIG[type];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-px">
      <div className={`absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r ${c.grad}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground/60">{label}</p>
          <div className="mt-2.5">
            {value === undefined ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <p className={cn('text-[21px] font-black tabular-nums tracking-tight leading-none', c.amount)}>
                {formatAmount(value)}
              </p>
            )}
          </div>
          {sub && <p className="mt-1.5 text-[11px] font-medium text-muted-foreground/55">{sub}</p>}
        </div>
        <div className={cn('size-10 shrink-0 rounded-xl flex items-center justify-center', c.iconBg)}>
          {icon}
        </div>
      </div>
      {barRatio !== undefined && (
        <div className="mt-4 space-y-1">
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div className={cn('h-full rounded-full transition-all duration-700', c.bar)} style={{ width: `${Math.min(barRatio, 100)}%` }} />
          </div>
          <p className="text-[9.5px] font-semibold text-muted-foreground/40 tabular-nums">{barRatio}% share</p>
        </div>
      )}
    </div>
  );
}

function CashflowBar({ income, expenses }: { income: number; expenses: number }) {
  const total = income + expenses;
  if (total === 0) return null;
  const incomeRatio = Math.round((income / total) * 100);
  const expenseRatio = 100 - incomeRatio;
  const net = income - expenses;
  const isPositive = net >= 0;

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground/60">Cash Flow</p>
          <span className={cn(
            'inline-flex items-center gap-0.5 text-[11px] font-black px-2 py-0.5 rounded-full',
            isPositive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600',
          )}>
            {isPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {formatAmount(Math.abs(net))}
          </span>
        </div>
        <span className="text-[11px] font-bold text-muted-foreground/50 tabular-nums">
          {incomeRatio}% <span className="text-muted-foreground/30">·</span> {expenseRatio}%
        </span>
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full gap-px bg-muted">
        <div className="h-full rounded-l-full bg-emerald-500 transition-all duration-700" style={{ width: `${incomeRatio}%` }} />
        <div className="h-full rounded-r-full bg-rose-500 transition-all duration-700" style={{ width: `${expenseRatio}%` }} />
      </div>
      <div className="mt-2 flex items-center gap-5">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/60">
          <span className="size-2 rounded-full bg-emerald-500" />
          Income · {incomeRatio}%
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/60">
          <span className="size-2 rounded-full bg-rose-500" />
          Expenses · {expenseRatio}%
        </span>
      </div>
    </div>
  );
}

export function FinanceWorkspace() {
  const t = useTranslations('finance');
  const tCommon = useTranslations('common');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [paymentPage] = useState(1);
  const [expensePage] = useState(1);

  const paymentsQuery = usePayments({ page: paymentPage, limit: 50 });
  const expensesQuery = useExpenses({ page: expensePage, limit: 50 });
  const summaryQuery = useFinanceSummary();
  const deletePayment = useDeletePayment();
  const deleteExpense = useDeleteExpense();

  const summary = summaryQuery.data;
  const payments: Payment[] = paymentsQuery.data?.items ?? [];
  const expenses: Expense[] = expensesQuery.data?.items ?? [];

  const handleDeletePayment = async (id: string) => {
    if (!confirm(tCommon('confirm_delete_payment'))) return;
    deletePayment.mutate(id);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm(tCommon('confirm_delete_expense'))) return;
    deleteExpense.mutate(id);
  };

  const totalFlow = (summary?.totalIncome ?? 0) + (summary?.totalExpenses ?? 0);
  const incomeShare = totalFlow > 0 ? Math.round(((summary?.totalIncome ?? 0) / totalFlow) * 100) : 0;
  const expenseShare = totalFlow > 0 ? Math.round(((summary?.totalExpenses ?? 0) / totalFlow) * 100) : 0;

  return (
    <div className="flex flex-col gap-5 p-6">

      {/* ── Header ────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-9 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-sm">
              <Wallet className="size-4.5" />
            </div>
            <div>
              <h1 className="text-[17px] font-black tracking-tight leading-none">{t('title')}</h1>
              <p className="text-[12px] text-muted-foreground/70 font-medium mt-0.5">{t('subtitle')}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-1.5 h-8 px-3.5 text-[12.5px] font-semibold border-rose-200/80 text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/50"
            onClick={() => setExpenseModalOpen(true)}
          >
            <TrendingDown className="size-3.5" />
            {t('add_expense')}
          </Button>
          <Button
            size="sm"
            className="rounded-xl gap-1.5 h-8 px-3.5 text-[12.5px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            onClick={() => setPaymentModalOpen(true)}
          >
            <Plus className="size-3.5" />
            {t('add_payment')}
          </Button>
        </div>
      </div>

      {/* ── Stat Cards ────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={t('total_revenue')}
          value={summary?.totalIncome}
          icon={<TrendingUp className="size-4.5" />}
          type="income"
          sub={`${paymentsQuery.data?.meta.total ?? 0} ${t('payments')}`}
          barRatio={incomeShare}
        />
        <StatCard
          label={t('total_expenses')}
          value={summary?.totalExpenses}
          icon={<TrendingDown className="size-4.5" />}
          type="expense"
          sub={`${expensesQuery.data?.meta.total ?? 0} ${tCommon('transactions')}`}
          barRatio={expenseShare}
        />
        <StatCard
          label={t('net_profit')}
          value={summary?.profit}
          icon={<Wallet className="size-4.5" />}
          type="profit"
          sub={tCommon('income_minus_expenses')}
        />
      </div>

      {/* ── Cashflow Bar ──────────────────────────── */}
      {summary && (
        <CashflowBar income={summary.totalIncome} expenses={summary.totalExpenses} />
      )}

      {/* ── Tabs ──────────────────────────────────── */}
      <Tabs defaultValue="payments" className="space-y-3">
        <div className="flex items-center justify-between">
          <TabsList className="h-8 rounded-xl bg-muted/60 p-0.5 gap-0.5">
            <TabsTrigger
              value="payments"
              className="h-7 rounded-[10px] px-3 text-[12px] gap-1.5 font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <ReceiptText className="size-3" />
              {t('payments')}
              {paymentsQuery.data?.meta.total !== undefined && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-black">
                  {paymentsQuery.data.meta.total}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="expenses"
              className="h-7 rounded-[10px] px-3 text-[12px] gap-1.5 font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <ShoppingBag className="size-3" />
              {t('expenses')}
              {expensesQuery.data?.meta.total !== undefined && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 text-[10px] font-black">
                  {expensesQuery.data.meta.total}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Payments Tab ──────────────────────────── */}
        <TabsContent value="payments" className="mt-0">
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/40">
                  <TableHead className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50 py-3 pl-4 w-[120px]">{tCommon('date')}</TableHead>
                  <TableHead className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50">{tCommon('student')}</TableHead>
                  <TableHead className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50 text-right pr-4">{t('amount')}</TableHead>
                  <TableHead className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50 hidden sm:table-cell">{t('payment_type')}</TableHead>
                  <TableHead className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50 hidden md:table-cell">{tCommon('note')}</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentsQuery.isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-border/30">
                      <TableCell className="pl-4"><Skeleton className="h-3.5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-3.5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-3.5 w-24 ml-auto" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-3.5 w-28" /></TableCell>
                      <TableCell />
                    </TableRow>
                  ))
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-14 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                          <ReceiptText className="size-5 text-emerald-500" />
                        </div>
                        <p className="text-[13px] font-semibold text-muted-foreground/70">No payments yet</p>
                        <button
                          onClick={() => setPaymentModalOpen(true)}
                          className="text-[12px] font-bold text-emerald-600 hover:text-emerald-700 underline-offset-2 hover:underline"
                        >
                          Record first payment
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow key={p.id} className="group border-b border-border/30 hover:bg-emerald-500/[0.03] transition-colors">
                      <TableCell className="py-3 pl-4">
                        <span className="text-[11.5px] tabular-nums font-medium text-muted-foreground/60">{formatDate(p.paid_at)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 shrink-0 rounded-lg bg-emerald-500/12 text-[9.5px] font-black text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                            {p.student_name ? getInitials(p.student_name) : '?'}
                          </div>
                          <span className="text-[13px] font-semibold">{p.student_name ?? '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <span className="text-[13px] font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                          +{formatAmount(p.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {METHOD_CONFIG[p.method] && (
                          <Badge
                            variant="outline"
                            className={cn('rounded-full gap-1 text-[10.5px] px-2 py-0.5 font-semibold border', METHOD_CONFIG[p.method].className)}
                          >
                            {METHOD_CONFIG[p.method].icon}
                            {METHOD_CONFIG[p.method].label}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-[11.5px] text-muted-foreground/55 max-w-[160px] truncate hidden md:table-cell">
                        {p.description || '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-lg opacity-0 group-hover:opacity-100 text-destructive/40 hover:text-destructive hover:bg-destructive/8 transition-all"
                          onClick={() => handleDeletePayment(p.id)}
                          disabled={deletePayment.isPending}
                        >
                          {deletePayment.isPending ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3.5" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Expenses Tab ──────────────────────────── */}
        <TabsContent value="expenses" className="mt-0">
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/40">
                  <TableHead className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50 py-3 pl-4 w-[120px]">{tCommon('date')}</TableHead>
                  <TableHead className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50">{tCommon('category')}</TableHead>
                  <TableHead className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50 text-right pr-4">{t('amount')}</TableHead>
                  <TableHead className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50 hidden md:table-cell">{tCommon('description')}</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {expensesQuery.isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-border/30">
                      <TableCell className="pl-4"><Skeleton className="h-3.5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-3.5 w-24 ml-auto" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-3.5 w-32" /></TableCell>
                      <TableCell />
                    </TableRow>
                  ))
                ) : expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-14 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="size-12 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                          <ShoppingBag className="size-5 text-rose-500" />
                        </div>
                        <p className="text-[13px] font-semibold text-muted-foreground/70">No expenses yet</p>
                        <button
                          onClick={() => setExpenseModalOpen(true)}
                          className="text-[12px] font-bold text-rose-600 hover:text-rose-700 underline-offset-2 hover:underline"
                        >
                          Add first expense
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((e) => (
                    <TableRow key={e.id} className="group border-b border-border/30 hover:bg-rose-500/[0.03] transition-colors">
                      <TableCell className="py-3 pl-4">
                        <span className="text-[11.5px] tabular-nums font-medium text-muted-foreground/60">{formatDate(e.expense_date)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn('rounded-full text-[10.5px] px-2.5 py-0.5 font-semibold border', CATEGORY_COLORS[e.category] ?? CATEGORY_COLORS.OTHER)}
                        >
                          {e.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <span className="text-[13px] font-black text-rose-600 dark:text-rose-400 tabular-nums">
                          -{formatAmount(e.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-[11.5px] text-muted-foreground/55 max-w-[200px] truncate hidden md:table-cell">
                        {e.description ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-lg opacity-0 group-hover:opacity-100 text-destructive/40 hover:text-destructive hover:bg-destructive/8 transition-all"
                          onClick={() => handleDeleteExpense(e.id)}
                          disabled={deleteExpense.isPending}
                        >
                          {deleteExpense.isPending ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3.5" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <AddPaymentModal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} />
      <AddExpenseModal open={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} />
    </div>
  );
}
