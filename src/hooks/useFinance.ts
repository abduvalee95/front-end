import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { paymentService, expenseService } from '@/services/finance';
import { analyticsService } from '@/services/analytics';
import { useAuthStore } from '@/store/auth.store';
import type { CreatePaymentDto, CreateExpenseDto, ExpenseFilters, PaymentFilters } from '@/types/finance';

export const FINANCE_KEYS = {
  all: (orgId: string | undefined) => ['finance', orgId] as const,
  payments: (orgId: string | undefined, filters?: PaymentFilters) => [...FINANCE_KEYS.all(orgId), 'payments', filters] as const,
  expenses: (orgId: string | undefined, filters?: ExpenseFilters) => [...FINANCE_KEYS.all(orgId), 'expenses', filters] as const,
  summary: (orgId: string | undefined, from?: string, to?: string) => [...FINANCE_KEYS.all(orgId), 'summary', { from, to }] as const,
};

export function usePayments(filters?: PaymentFilters, enabled = true) {
  const { user } = useAuthStore();
  const orgId = user?.organization_id;
  return useQuery({
    queryKey: FINANCE_KEYS.payments(orgId, filters),
    queryFn: () => paymentService.list(filters),
    enabled: enabled && !!orgId,
  });
}

export function useExpenses(filters?: ExpenseFilters, enabled = true) {
  const { user } = useAuthStore();
  const orgId = user?.organization_id;
  return useQuery({
    queryKey: FINANCE_KEYS.expenses(orgId, filters),
    queryFn: () => expenseService.list(filters),
    enabled: enabled && !!orgId,
  });
}

export function useFinanceSummary(from?: string, to?: string) {
  const { user } = useAuthStore();
  const orgId = user?.organization_id;
  return useQuery({
    queryKey: FINANCE_KEYS.summary(orgId, from, to),
    queryFn: () =>
      analyticsService.getFinanceSummary({
        from: from ? new Date(from) : null,
        to: to ? new Date(to) : null,
      }),
    enabled: !!orgId,
    retry: false,
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const orgId = user?.organization_id;
  return useMutation({
    mutationFn: (data: CreatePaymentDto) => paymentService.create(data),
    onSuccess: () => {
      toast.success('Payment added');
      qc.invalidateQueries({ queryKey: FINANCE_KEYS.all(orgId) });
    },
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const orgId = user?.organization_id;
  return useMutation({
    mutationFn: (id: string) => paymentService.remove(id),
    onSuccess: () => {
      toast.success('Payment deleted');
      qc.invalidateQueries({ queryKey: FINANCE_KEYS.all(orgId) });
    },
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const orgId = user?.organization_id;
  return useMutation({
    mutationFn: (data: CreateExpenseDto) => expenseService.create(data),
    onSuccess: () => {
      toast.success('Expense added');
      qc.invalidateQueries({ queryKey: FINANCE_KEYS.all(orgId) });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const orgId = user?.organization_id;
  return useMutation({
    mutationFn: (id: string) => expenseService.remove(id),
    onSuccess: () => {
      toast.success('Expense deleted');
      qc.invalidateQueries({ queryKey: FINANCE_KEYS.all(orgId) });
    },
  });
}
