// Single definition of nav items with their role restrictions.
// Sidebar and BottomNav both import from here — eliminates duplication.

export type NavKey =
  | 'dashboard' | 'journal' | 'leads' | 'courses' | 'teachers'
  | 'students' | 'groups' | 'attendance' | 'schedule'
  | 'reports' | 'finance' | 'settings' | 'analytics' | 'subjects';

export interface NavItemConfig {
  key: NavKey;
  href: string;
  // null = all authenticated roles
  roles: ('SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'TEACHER')[] | null;
}

export const NAV_ITEMS: NavItemConfig[] = [
  { key: 'dashboard',  href: '/dashboard',  roles: null },
  { key: 'journal',    href: '/journal',    roles: null },
  { key: 'students',   href: '/students',   roles: null },
  { key: 'groups',     href: '/groups',     roles: null },
  { key: 'attendance', href: '/attendance', roles: null },
  { key: 'schedule',   href: '/schedule',   roles: null },
  { key: 'courses',    href: '/courses',    roles: null },
  { key: 'leads',      href: '/leads',      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { key: 'teachers',   href: '/teachers',   roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { key: 'finance',    href: '/finance',    roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { key: 'reports',    href: '/reports',    roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { key: 'settings',   href: '/settings',   roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TEACHER'] },
  { key: 'analytics',  href: '/analytics',  roles: ['ADMIN', 'MANAGER'] },
  { key: 'subjects',   href: '/subjects',   roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
];

export function navItemsForRole(role: string | undefined): NavItemConfig[] {
  return NAV_ITEMS.filter((item) => {
    if (item.roles === null) return true;
    if (!role) return false;
    return (item.roles as string[]).includes(role);
  });
}
