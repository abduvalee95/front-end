import type { Student } from '@/types/student';

export type ViewMode = 'all' | 'teacher';

export type StudentRow = Pick<Student, 'id' | 'name' | 'phone' | 'status'> & {
  address?: string;
  parent?: string;
  groups: string[];
  courses: string[];
  teachers: string[];
};

export const PAGE_SIZE = 10;

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700',
  'bg-orange-100 text-orange-700',
];

export function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}
