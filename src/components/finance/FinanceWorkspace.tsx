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
  ChevronRight,
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

function StatCard({
  label,
  value,
  icon,
  accent,
  sub,
}: {
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
  accent: 'emerald' | 'rose' | 'blue';
  sub?: string;
}) {
  const accentMap = {
    emerald: {
      icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      amount: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-l-emerald-500',
    },
    rose: {
      icon: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      amount: 'text-rose-600 dark:text-rose-400',
      border: 'border-l-rose-500',
    },
    blue: {
      icon: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      amount: 'text-blue-600 dark:text-blue-400',
      border: 'border-l-blue-500',
    },
  };

  const colors = accentMap[accent];

  return (
    <div className={`relative rounded-2xl border border-border/60 bg-card border-l-4 ${colors.border} p-5 shadow-sm transition-shadow hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
          <div className="mt-2">
            {value === undefined ? (
              <Skeleton className="h-8 w-40" />
            ) : (
              <p className={`text-2xl font-bold tracking-tight ${colors.amount}`}>
                {formatAmount(value)}
              </p>
            )}
          </div>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${colors.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function RatioBar({ income, expenses, tCommon }: { income: number; expenses: number; tCommon: ReturnType<typeof useTranslations> }) {
  const total = income + expenses;
  if (total === 0) return null;
  const incomeRatio = Math.round((income / total) * 100);
  const expenseRatio = 100 - incomeRatio;

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{tCommon('income_vs_expenses')}</p>
        <span className="text-xs text-muted-foreground">{incomeRatio}% / {expenseRatio}%</span>
      </div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full gap-0.5">
        <div
          className="h-full rounded-l-full bg-emerald-500 transition-all duration-700"
          style={{ width: `${incomeRatio}%` }}
        />
        <div
          className="h-full rounded-r-full bg-rose-500 transition-all duration-700"
          style={{ width: `${expenseRatio}%` }}
        />
      </div>
      <div className="mt-2.5 flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-emerald-500 inline-block" />
          Income
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-rose-500 inline-block" />
          Expenses
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

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Wallet className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-xl gap-2 h-9 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950"
            onClick={() => setExpenseModalOpen(true)}
          >
            <TrendingDown className="size-3.5" />
            {t('add_expense')}
          </Button>
          <Button
            className="rounded-xl gap-2 h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            onClick={() => setPaymentModalOpen(true)}
          >
            <Plus className="size-3.5" />
            {t('add_payment')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={t('total_revenue')}
          value={summary?.totalIncome}
          icon={<TrendingUp className="size-5" />}
          accent="emerald"
          sub={`${paymentsQuery.data?.meta.total ?? 0} ${t('payments')}`}
        />
        <StatCard
          label={t('total_expenses')}
          value={summary?.totalExpenses}
          icon={<TrendingDown className="size-5" />}
          accent="rose"
          sub={`${expensesQuery.data?.meta.total ?? 0} ${tCommon('transactions')}`}
        />
        <StatCard
          label={t('net_profit')}
          value={summary?.profit}
          icon={<Wallet className="size-5" />}
          accent="blue"
          sub={tCommon('income_minus_expenses')}
        />
      </div>

      {/* Ratio Bar */}
      {summary && (
        <RatioBar income={summary.totalIncome} expenses={summary.totalExpenses} tCommon={tCommon} />
      )}

      {/* Tabs */}
      <Tabs defaultValue="payments">
        <div className="flex items-center justify-between">
          <TabsList className="rounded-xl h-9">
            <TabsTrigger value="payments" className="rounded-lg text-xs gap-1.5 h-7 px-3">
              <ReceiptText className="size-3.5" />
              {t('payments')}
              {paymentsQuery.data?.meta.total !== undefined && (
                <Badge variant="secondary" className="rounded-full text-[10px] px-1.5 py-0 h-4 min-w-4">
                  {paymentsQuery.data.meta.total}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="expenses" className="rounded-lg text-xs gap-1.5 h-7 px-3">
              <ShoppingBag className="size-3.5" />
              {t('expenses')}
              {expensesQuery.data?.meta.total !== undefined && (
                <Badge variant="secondary" className="rounded-full text-[10px] px-1.5 py-0 h-4 min-w-4">
                  {expensesQuery.data.meta.total}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Payments Tab */}
        <TabsContent value="payments" className="mt-3">
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 py-3">{tCommon('date')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">{tCommon('student')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">{t('amount')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">{t('payment_type')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">{tCommon('note')}</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentsQuery.isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10">
                          <ReceiptText className="size-6 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">No payments yet</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Record the first payment to get started</p>
                        </div>
                        <button
                          onClick={() => setPaymentModalOpen(true)}
                          className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline font-medium"
                        >
                          Add first payment <ChevronRight className="size-3" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow key={p.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="py-3.5">
                        <span className="text-xs text-muted-foreground tabular-nums">{formatDate(p.paid_at)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                            {p.student_name ? getInitials(p.student_name) : '?'}
                          </div>
                          <span className="text-sm font-medium">{p.student_name ?? '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          +{formatAmount(p.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {METHOD_CONFIG[p.method] && (
                          <Badge
                            variant="outline"
                            className={`rounded-full gap-1 text-[11px] px-2 py-0.5 font-medium border ${METHOD_CONFIG[p.method].className}`}
                          >
                            {METHOD_CONFIG[p.method].icon}
                            {METHOD_CONFIG[p.method].label}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                        {p.description || '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-lg opacity-0 group-hover:opacity-100 text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-all"
                          onClick={() => handleDeletePayment(p.id)}
                          disabled={deletePayment.isPending}
                        >
                          {deletePayment.isPending ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="mt-3">
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 py-3">Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Category</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Amount</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Description</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {expensesQuery.isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-500/10">
                          <ShoppingBag className="size-6 text-rose-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">No expenses yet</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Track your spending by adding an expense</p>
                        </div>
                        <button
                          onClick={() => setExpenseModalOpen(true)}
                          className="inline-flex items-center gap-1 text-xs text-rose-600 hover:underline font-medium"
                        >
                          Add first expense <ChevronRight className="size-3" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((e) => (
                    <TableRow key={e.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="py-3.5">
                        <span className="text-xs text-muted-foreground tabular-nums">{formatDate(e.expense_date)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`rounded-full text-[11px] px-2 py-0.5 font-medium border ${CATEGORY_COLORS[e.category] ?? CATEGORY_COLORS.OTHER}`}
                        >
                          {e.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                          -{formatAmount(e.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {e.description ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-lg opacity-0 group-hover:opacity-100 text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-all"
                          onClick={() => handleDeleteExpense(e.id)}
                          disabled={deleteExpense.isPending}
                        >
                          {deleteExpense.isPending ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
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
