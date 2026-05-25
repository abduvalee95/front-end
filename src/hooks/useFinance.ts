import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { paymentService, expenseService } from '@/services/finance';
import { analyticsService } from '@/services/analytics';
import { useAuthStore } from '@/store/auth.store';
import { queryKeys } from '@/lib/api/query-keys';
import type { CreatePaymentDto, CreateExpenseDto, ExpenseFilters, PaymentFilters } from '@/types/finance';

export function usePayments(filters?: PaymentFilters, enabled = true) {
  const orgId = useAuthStore((s) => s.user?.organization_id);
  return useQuery({
    queryKey: queryKeys.finance.payments(orgId, filters as Record<string, unknown>),
    queryFn: () => paymentService.list(filters),
    enabled: enabled && !!orgId,
  });
}

export function useExpenses(filters?: ExpenseFilters, enabled = true) {
  const orgId = useAuthStore((s) => s.user?.organization_id);
  return useQuery({
    queryKey: queryKeys.finance.expenses(orgId, filters as Record<string, unknown>),
    queryFn: () => expenseService.list(filters),
    enabled: enabled && !!orgId,
  });
}

export function useFinanceSummary(from?: string, to?: string) {
  const orgId = useAuthStore((s) => s.user?.organization_id);
  return useQuery({
    queryKey: queryKeys.finance.summary(orgId, from, to),
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
  const orgId = useAuthStore((s) => s.user?.organization_id);
  return useMutation({
    mutationFn: (data: CreatePaymentDto) => paymentService.create(data),
    onSuccess: () => {
      toast.success('Payment added');
      qc.invalidateQueries({ queryKey: queryKeys.finance.all(orgId) });
    },
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  const orgId = useAuthStore((s) => s.user?.organization_id);
  return useMutation({
    mutationFn: (id: string) => paymentService.remove(id),
    onSuccess: () => {
      toast.success('Payment deleted');
      qc.invalidateQueries({ queryKey: queryKeys.finance.all(orgId) });
    },
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  const orgId = useAuthStore((s) => s.user?.organization_id);
  return useMutation({
    mutationFn: (data: CreateExpenseDto) => expenseService.create(data),
    onSuccess: () => {
      toast.success('Expense added');
      qc.invalidateQueries({ queryKey: queryKeys.finance.all(orgId) });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  const orgId = useAuthStore((s) => s.user?.organization_id);
  return useMutation({
    mutationFn: (id: string) => expenseService.remove(id),
    onSuccess: () => {
      toast.success('Expense deleted');
      qc.invalidateQueries({ queryKey: queryKeys.finance.all(orgId) });
    },
  });
}
