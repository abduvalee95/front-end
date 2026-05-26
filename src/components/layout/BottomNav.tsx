'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from '@/i18n/index';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  GraduationCap,
  UsersRound,
  CreditCard,
  Menu,
  NotebookPen,
  BookMarked,
  Users,
  Calendar,
  ClipboardCheck,
  BarChart3,
  Settings,
  X,
  LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { navItemsForRole, type NavKey, type NavItemConfig } from '@/lib/nav-config';

const ICONS: Record<NavKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  journal: NotebookPen,
  leads: Users,
  courses: BookMarked,
  teachers: GraduationCap,
  students: GraduationCap,
  groups: UsersRound,
  attendance: ClipboardCheck,
  schedule: Calendar,
  reports: BarChart3,
  finance: CreditCard,
  settings: Settings,
  analytics: BarChart3,
  subjects: BookMarked,
};

const PRIMARY_KEYS: NavKey[] = ['dashboard', 'students', 'groups', 'finance'];
const OVERFLOW_KEYS: NavKey[] = ['journal', 'leads', 'courses', 'teachers', 'attendance', 'schedule', 'reports', 'settings'];

type RenderItem = NavItemConfig & { icon: LucideIcon };

export function BottomNav() {
  const pathname = usePathname();
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const role = useAuthStore((s) => s.user?.role);
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();

  const allowed = navItemsForRole(role);
  const allowedByKey = new Map<NavKey, RenderItem>(
    allowed.map((item) => [item.key, { ...item, icon: ICONS[item.key] }]),
  );
  const primary: RenderItem[] = PRIMARY_KEYS
    .map((k) => allowedByKey.get(k))
    .filter((v): v is RenderItem => !!v);
  const overflow: RenderItem[] = OVERFLOW_KEYS
    .map((k) => allowedByKey.get(k))
    .filter((v): v is RenderItem => !!v);

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bottom-nav-safe border-t border-slate-200/70 bg-white/95 backdrop-blur-lg shadow-[0_-2px_12px_rgba(15,23,42,0.06)]"
        style={{ height: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom, 0px))' }}
        aria-label="Mobile bottom navigation"
      >
        <ul className="flex h-16 items-stretch justify-around">
          {primary.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const label = tNav(item.key as Parameters<typeof tNav>[0]);
            return (
              <li key={item.key} className="flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    'flex h-full flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors',
                    active ? 'text-blue-600' : 'text-slate-500 active:text-slate-800',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className={cn('size-5', active && 'stroke-[2.5]')} />
                  <span className="truncate max-w-[60px]">{label}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={cn(
                'flex h-full w-full flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors',
                open ? 'text-blue-600' : 'text-slate-500 active:text-slate-800',
              )}
              aria-label="More menu"
            >
              <Menu className="size-5" />
              <span>{tCommon('more') || 'More'}</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Overflow sheet */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150" />
          <div
            className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-200"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="mx-auto h-1.5 w-10 rounded-full bg-slate-300" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3">
              <h2 className="text-base font-semibold text-slate-900">
                {tCommon('menu') || 'Menu'}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-slate-500 active:bg-slate-100"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <ul className="grid grid-cols-4 gap-2 px-4 pb-4">
              {overflow.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                const label = tNav(item.key as Parameters<typeof tNav>[0]);
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-3 text-[11px] font-medium transition-colors',
                        active
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-slate-600 active:bg-slate-100',
                      )}
                    >
                      <Icon className="size-5" />
                      <span className="truncate max-w-full">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-slate-100 px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 active:bg-red-100"
              >
                <LogOut className="size-4" />
                {tCommon('logout') || 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
