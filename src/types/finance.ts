export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER';

export type ExpenseCategory =
  | 'RENT'
  | 'SALARY'
  | 'UTILITIES'
  | 'MARKETING'
  | 'SUPPLIES'
  | 'EQUIPMENT'
  | 'OTHER';

export interface Payment {
  id: string;
  organization_id: string;
  student_id: string;
  student_name?: string;
  amount: number;
  method: PaymentMethod;
  status: string;
  description: string | null;
  receipt_number?: string | null;
  paid_at: string;
  created_at: string;
}

export interface CreatePaymentDto {
  student_id: string;
  amount: number;
  method: PaymentMethod;
  description?: string;
}

export interface Expense {
  id: string;
  organization_id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  paid_at: string;
  created_by: string;
  creator_name?: string;
  created_at: string;
}

export interface CreateExpenseDto {
  amount: number;
  category: ExpenseCategory;
  description: string;
}

export interface PaginatedPayments {
  items: Payment[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export interface PaginatedExpenses {
  items: Expense[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  method?: PaymentMethod;
  student_id?: string;
}

export interface ExpenseFilters {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  category?: ExpenseCategory;
}
