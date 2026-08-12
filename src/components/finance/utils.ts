import type { ReactNode } from 'react';
import type { PaymentMethod } from '@/types/finance';
import type { Tone } from '@/components/ui/tone';

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

/**
 * Expense categories and payment methods are labelled with design-system
 * tones, not per-category colours — there are five tones in the product and
 * every label has to be one of them.
 */
export const CATEGORY_TONES: Record<string, Tone> = {
  RENT: 'warning',
  SALARY: 'primary',
  UTILITIES: 'warning',
  MARKETING: 'primary',
  SUPPLIES: 'success',
  EQUIPMENT: 'primary',
  OTHER: 'neutral',
};

export const METHOD_TONES: Record<PaymentMethod, Tone> = {
  CASH: 'success',
  CARD: 'primary',
  TRANSFER: 'neutral',
};

export const STAT_TONES = {
  income: 'success',
  expense: 'danger',
  profit: 'primary',
} as const satisfies Record<string, Tone>;

export type StatType = keyof typeof STAT_TONES;
