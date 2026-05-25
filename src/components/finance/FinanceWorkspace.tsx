'use client';

import { useState } from 'react';
import {
  Plus,
  ReceiptText,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from '@/i18n/index';
import {
  useDeleteExpense,
  useDeletePayment,
  useExpenses,
  useFinanceSummary,
  usePayments,
} from '@/hooks/useFinance';
import { AddExpenseModal } from './AddExpenseModal';
import { AddPaymentModal } from './AddPaymentModal';
import { CashflowBar } from './CashflowBar';
import { ExpensesTable } from './ExpensesTable';
import { FinanceStatCard } from './FinanceStatCard';
import { PaymentsTable } from './PaymentsTable';

export function FinanceWorkspace() {
  const t = useTranslations('finance');
  const tCommon = useTranslations('common');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  const paymentsQuery = usePayments({ page: 1, limit: 50 });
  const expensesQuery = useExpenses({ page: 1, limit: 50 });
  const summaryQuery = useFinanceSummary();
  const deletePayment = useDeletePayment();
  const deleteExpense = useDeleteExpense();

  const summary = summaryQuery.data;
  const payments = paymentsQuery.data?.items ?? [];
  const expenses = expensesQuery.data?.items ?? [];

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
    <Tabs defaultValue="payments" className="flex flex-col gap-5 p-6">
      {/* Header + Tabs */}
      <div className="flex flex-col gap-4">
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

        {/* Tabs */}
        <TabsList className="h-12 rounded-2xl bg-muted/70 dark:bg-white/5 p-1.5 gap-1 inline-flex w-fit shadow-[0_2px_12px_rgba(15,23,42,0.04)] ring-1 ring-border/40">
          <TabsTrigger
            value="payments"
            className="h-9 px-4 rounded-xl gap-2 text-[13px] font-semibold text-muted-foreground/80 hover:text-foreground hover:bg-background/50 data-active:bg-background data-active:text-foreground data-active:shadow-[0_4px_14px_rgba(15,23,42,0.08)] data-active:ring-1 data-active:ring-border/60 transition-all duration-200"
          >
            <ReceiptText className="size-4 text-emerald-500 dark:text-emerald-400" />
            <span>{t('payments')}</span>
            {paymentsQuery.data?.meta.total !== undefined && (
              <span className="inline-flex items-center justify-center min-w-[22px] h-[20px] px-1.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10.5px] font-black tabular-nums leading-none">
                {paymentsQuery.data.meta.total}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="expenses"
            className="h-9 px-4 rounded-xl gap-2 text-[13px] font-semibold text-muted-foreground/80 hover:text-foreground hover:bg-background/50 data-active:bg-background data-active:text-foreground data-active:shadow-[0_4px_14px_rgba(15,23,42,0.08)] data-active:ring-1 data-active:ring-border/60 transition-all duration-200"
          >
            <ShoppingBag className="size-4 text-rose-500 dark:text-rose-400" />
            <span>{t('expenses')}</span>
            {expensesQuery.data?.meta.total !== undefined && (
              <span className="inline-flex items-center justify-center min-w-[22px] h-[20px] px-1.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[10.5px] font-black tabular-nums leading-none">
                {expensesQuery.data.meta.total}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FinanceStatCard
          label={t('total_revenue')}
          value={summary?.totalIncome}
          icon={<TrendingUp className="size-4.5" />}
          type="income"
          sub={`${paymentsQuery.data?.meta.total ?? 0} ${t('payments')}`}
          barRatio={incomeShare}
        />
        <FinanceStatCard
          label={t('total_expenses')}
          value={summary?.totalExpenses}
          icon={<TrendingDown className="size-4.5" />}
          type="expense"
          sub={`${expensesQuery.data?.meta.total ?? 0} ${tCommon('transactions')}`}
          barRatio={expenseShare}
        />
        <FinanceStatCard
          label={t('net_profit')}
          value={summary?.profit}
          icon={<Wallet className="size-4.5" />}
          type="profit"
          sub={tCommon('income_minus_expenses')}
        />
      </div>

      {/* Cashflow Bar */}
      {summary && <CashflowBar income={summary.totalIncome} expenses={summary.totalExpenses} />}

      {/* Payments Tab */}
      <TabsContent value="payments" className="mt-0">
        <PaymentsTable
          payments={payments}
          isLoading={paymentsQuery.isLoading}
          onAddPayment={() => setPaymentModalOpen(true)}
          onDelete={handleDeletePayment}
          isDeleting={deletePayment.isPending}
        />
      </TabsContent>

      {/* Expenses Tab */}
      <TabsContent value="expenses" className="mt-0">
        <ExpensesTable
          expenses={expenses}
          isLoading={expensesQuery.isLoading}
          onAddExpense={() => setExpenseModalOpen(true)}
          onDelete={handleDeleteExpense}
          isDeleting={deleteExpense.isPending}
        />
      </TabsContent>

      <AddPaymentModal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} />
      <AddExpenseModal open={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} />
    </Tabs>
  );
}
