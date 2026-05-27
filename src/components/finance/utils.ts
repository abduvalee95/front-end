import type { ReactNode } from 'react';
import type { PaymentMethod } from '@/types/finance';

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ky-KG').format(amount) + ' KGS';
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export interface MethodConfig {
  label: string;
  icon: ReactNode;
  className: string;
}

export const CATEGORY_COLORS: Record<string, string> = {
  RENT: 'bg-orange-500/10 text-orange-700 border-orange-200 dark:text-orange-400 dark:border-orange-800',
  SALARY: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800',
  UTILITIES: 'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:text-yellow-400 dark:border-yellow-800',
  MARKETING: 'bg-pink-500/10 text-pink-700 border-pink-200 dark:text-pink-400 dark:border-pink-800',
  SUPPLIES: 'bg-teal-500/10 text-teal-700 border-teal-200 dark:text-teal-400 dark:border-teal-800',
  EQUIPMENT: 'bg-indigo-500/10 text-indigo-700 border-indigo-200 dark:text-indigo-400 dark:border-indigo-800',
  OTHER: 'bg-muted text-muted-foreground',
};

// Method config returned with className only — icons stay inline in TSX
export const METHOD_CLASSES: Record<PaymentMethod, string> = {
  CASH: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800',
  CARD: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800',
  TRANSFER: 'bg-violet-500/10 text-violet-700 border-violet-200 dark:text-violet-400 dark:border-violet-800',
};

export const STAT_CONFIG = {
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

export type StatType = keyof typeof STAT_CONFIG;
