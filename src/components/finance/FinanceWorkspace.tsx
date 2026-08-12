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
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from '@/i18n/index';
import {
  useDeleteExpense,
  useDeletePayment,
  useExpenses,
  useFinanceSummary,
  usePayments,
} from '@/hooks/useFinance';
import { formatAmount } from './utils';
import { AddExpenseModal } from './AddExpenseModal';
import { AddPaymentModal } from './AddPaymentModal';
import { CashflowBar } from './CashflowBar';
import { ExpensesTable } from './ExpensesTable';
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
    <Tabs defaultValue="payments" className="flex flex-col gap-5">
      <PageHeader
        icon={Wallet}
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <>
            <Button variant="danger" size="sm" onClick={() => setExpenseModalOpen(true)}>
              <TrendingDown className="size-4" />
              {t('add_expense')}
            </Button>
            <Button size="sm" onClick={() => setPaymentModalOpen(true)}>
              <Plus className="size-4" />
              {t('add_payment')}
            </Button>
          </>
        }
      />

      <TabsList className="inline-flex h-11 w-fit gap-1 rounded-card border border-border bg-muted p-1">
          <TabsTrigger
            value="payments"
            className="h-9 gap-2 rounded-control px-4 text-body-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground data-active:bg-card data-active:text-foreground data-active:shadow-card"
          >
            <ReceiptText className="size-4 text-success-emphasis" />
            <span>{t('payments')}</span>
            {paymentsQuery.data?.meta.total !== undefined && (
              <Badge variant="success" className="tabular-nums">
                {paymentsQuery.data.meta.total}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="expenses"
            className="h-9 gap-2 rounded-control px-4 text-body-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground data-active:bg-card data-active:text-foreground data-active:shadow-card"
          >
            <ShoppingBag className="size-4 text-danger-emphasis" />
            <span>{t('expenses')}</span>
            {expensesQuery.data?.meta.total !== undefined && (
              <Badge variant="danger" className="tabular-nums">
                {expensesQuery.data.meta.total}
              </Badge>
            )}
          </TabsTrigger>
      </TabsList>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={TrendingUp}
          tone="success"
          label={t('total_revenue')}
          value={summary === undefined ? '—' : formatAmount(summary.totalIncome)}
          hint={`${paymentsQuery.data?.meta.total ?? 0} ${t('payments')}`}
          progress={incomeShare}
          isLoading={summaryQuery.isLoading}
        />
        <StatCard
          icon={TrendingDown}
          tone="danger"
          label={t('total_expenses')}
          value={summary === undefined ? '—' : formatAmount(summary.totalExpenses)}
          hint={`${expensesQuery.data?.meta.total ?? 0} ${tCommon('transactions')}`}
          progress={expenseShare}
          isLoading={summaryQuery.isLoading}
        />
        <StatCard
          icon={Wallet}
          tone="primary"
          label={t('net_profit')}
          value={summary === undefined ? '—' : formatAmount(summary.profit)}
          hint={tCommon('income_minus_expenses')}
          isLoading={summaryQuery.isLoading}
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
