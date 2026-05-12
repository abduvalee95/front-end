import { api } from '@/lib/api/client';
import type {
  CreateExpenseDto,
  CreatePaymentDto,
  Expense,
  ExpenseFilters,
  PaginatedExpenses,
  PaginatedPayments,
  Payment,
  PaymentFilters,
} from '@/types/finance';

const PAYMENT_URL = '/proxy/payment';
const EXPENSE_URL = '/proxy/expense';

export const paymentService = {
  async list(params?: PaymentFilters): Promise<PaginatedPayments> {
    const res = await api.get<PaginatedPayments>(PAYMENT_URL, { params });
    return res.data;
  },

  async create(data: CreatePaymentDto): Promise<Payment> {
    const res = await api.post<Payment>(PAYMENT_URL, data);
    return res.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`${PAYMENT_URL}/${id}`);
  },
};

export const expenseService = {
  async list(params?: ExpenseFilters): Promise<PaginatedExpenses> {
    const res = await api.get<PaginatedExpenses>(EXPENSE_URL, { params });
    return res.data;
  },

  async create(data: CreateExpenseDto): Promise<Expense> {
    const res = await api.post<Expense>(EXPENSE_URL, data);
    return res.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`${EXPENSE_URL}/${id}`);
  },
};
