import type { Student } from '@/types/student';

export type ViewMode = 'all' | 'teacher';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid' | 'unknown';

export type StudentRow = Pick<Student, 'id' | 'name' | 'phone' | 'status'> & {
  address?: string;
  parent?: string;
  groups: string[];
  courses: string[];
  teachers: string[];
  totalDiscount: number;
  paymentStatus: PaymentStatus;
  paymentPercent?: number; // 0-100, set when status === 'partial'
};

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];
export const DEFAULT_PAGE_SIZE: PageSizeOption = 25;
export const PAGE_SIZE = DEFAULT_PAGE_SIZE;

/**
 * Avatar tints cycle the design-system tones — an initial still gets a
 * stable colour, but it can only ever be one of the five the product owns.
 */
const AVATAR_TONES = [
  'bg-primary-muted text-primary-emphasis dark:text-primary',
  'bg-success-muted text-success-emphasis',
  'bg-warning-muted text-warning-emphasis',
  'bg-danger-muted text-danger-emphasis',
  'bg-neutral-muted text-neutral-emphasis',
];

export function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_TONES.length;
  return AVATAR_TONES[idx];
}
