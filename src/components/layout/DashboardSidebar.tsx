'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from '@/i18n/index';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationSettings } from '@/hooks/useOrganization';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  NotebookPen,
  BookMarked,
  UsersRound,
  ClipboardCheck,
  BarChart3,
  Settings,
  CreditCard,
  LogOut,
  ChevronLeft,
  Menu
} from 'lucide-react';
import { navItemsForRole, type NavKey, type NavItemConfig } from '@/lib/nav-config';

// UI-specific icon mapping (kept in the sidebar — not part of access logic)
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

const SIDEBAR_GROUPS: { groupKey: string; keys: NavKey[] }[] = [
  { groupKey: 'group_main',       keys: ['dashboard'] },
  { groupKey: 'group_management', keys: ['journal', 'leads', 'courses', 'teachers', 'students', 'groups'] },
  { groupKey: 'group_academic',   keys: ['attendance', 'schedule'] },
  { groupKey: 'group_system',     keys: ['reports', 'finance', 'settings'] },
];

type RenderItem = NavItemConfig & { icon: LucideIcon };

export function DashboardSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (window.innerWidth < 768) return true;
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved !== null ? saved === 'true' : false;
  });

  const handleToggle = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuth();
  const tNav = useTranslations('nav');
  const tAuth = useTranslations('auth');
  const { data: orgSettings } = useOrganizationSettings();

  // Filter allowed items by role, then group by SIDEBAR_GROUPS
  const allowed = navItemsForRole(user?.role);
  const allowedByKey = new Map<NavKey, RenderItem>(
    allowed.map((item) => [item.key, { ...item, icon: ICONS[item.key] }]),
  );
  const groups = SIDEBAR_GROUPS
    .map((g) => ({
      groupKey: g.groupKey,
      items: g.keys.map((k) => allowedByKey.get(k)).filter((v): v is RenderItem => !!v),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <aside
      className={cn(
        "dashboard-sidebar relative z-20 flex h-screen flex-col border-r shadow-2xl transition-all duration-500 ease-in-out",
        "text-sidebar-foreground backdrop-blur-md",
        isCollapsed ? "w-[80px]" : "w-[260px]"
      )}
    >
      {/* Sidebar Toggle Button */}
      <button
        onClick={handleToggle}
        className="absolute -right-3 top-10 size-6 bg-primary rounded-full flex items-center justify-center border border-border shadow-lg hover:scale-110 transition-transform z-30"
      >
        {isCollapsed ? <Menu className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
      </button>

      {/* Subtle glow to keep it premium — teal-family, ties into the glass sheen in globals.css */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,hsl(var(--sidebar-active)/0.12),transparent_15rem)]" />
      
      {/* Brand Section */}
      <div className={cn(
        "flex flex-col items-center pt-8 pb-6 relative transition-all duration-500",
        isCollapsed ? "px-2" : "px-5"
      )}>
        {(() => {
          const logoUrl = orgSettings?.logo_url ?? user?.organization_logo_url;
          const orgName = orgSettings?.name ?? user?.organization_name;
          return logoUrl ? (
            isCollapsed ? (
              <div className="size-12 rounded-xl overflow-hidden ring-2 ring-border shadow-lg">
                <Image
                  src={logoUrl}
                  alt={orgName ?? ''}
                  width={48}
                  height={48}
                  className="size-full object-cover"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="size-16 rounded-2xl overflow-hidden ring-2 ring-border shadow-lg shadow-primary/30">
                  <Image
                    src={logoUrl}
                    alt={orgName ?? ''}
                    width={64}
                    height={64}
                    className="size-full object-cover"
                  />
                </div>
                <div className="text-center w-full px-1">
                  <p className="text-body-sm font-bold text-sidebar-foreground truncate leading-tight">{orgName}</p>
                  <p className="text-caption text-sidebar-text uppercase tracking-wider mt-0.5">Education Center</p>
                </div>
              </div>
            )
          ) : orgName ? (
            isCollapsed ? null : (
              <div className="text-center w-full px-1 py-2">
                <p className="text-body-sm font-bold text-sidebar-foreground truncate leading-tight">{orgName}</p>
                <p className="text-caption text-sidebar-text uppercase tracking-wider mt-0.5">Education Center</p>
              </div>
            )
          ) : (
            <div className={cn(
              "flex items-center justify-center rounded-3xl transition-all duration-500 group relative overflow-hidden",
              isCollapsed ? "size-14" : "size-34"
            )}>
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10 transition-transform duration-500 group-hover:scale-110">
                <Image
                  src="/logo.svg"
                  alt="Logo"
                  width={isCollapsed ? 40 : 136}
                  height={isCollapsed ? 40 : 136}
                  className="object-contain brightness-0 invert opacity-90"
                  priority
                />
              </div>
            </div>
          );
        })()}
      </div>

      {/* Navigation */}
      <div className="scrollbar-hide relative flex-1 overflow-y-auto px-4 py-2 space-y-6">
        {groups.map((group) => (
          <div key={group.groupKey} className="space-y-1.5">
            {!isCollapsed && (
              <div className="px-4 mb-2">
                <p className="text-caption font-bold uppercase tracking-normal text-sidebar-text">
                  {tNav(group.groupKey as Parameters<typeof tNav>[0])}
                </p>
              </div>
            )}
            <nav className="flex flex-col space-y-1">
              {group.items.map((item) => {
                const label = tNav(item.key as Parameters<typeof tNav>[0]);
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group relative text-body font-semibold",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                        : "text-sidebar-text hover:bg-sidebar-hover-bg hover:text-sidebar-foreground",
                      isCollapsed && "justify-center px-2"
                    )}
                    aria-label={label}
                  >
                    <item.icon className={cn("size-5 shrink-0 transition-colors", isActive ? "text-primary-foreground" : "text-sidebar-text group-hover:text-sidebar-active")} />
                    {!isCollapsed && <span>{label}</span>}
                    {isCollapsed && (
                      <div className="pointer-events-none absolute left-full z-50 ml-4 whitespace-nowrap rounded-control border border-border bg-popover px-2 py-1 text-caption text-popover-foreground opacity-0 shadow-card transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                        {label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer Controls */}
      <div className="p-4 mt-auto border-t border-sidebar-border bg-sidebar-bg">
        <div className="flex items-center gap-3">
          {!isCollapsed ? (
            <div className="flex flex-1 items-center gap-3 px-3 py-3 rounded-2xl bg-sidebar-hover-bg border border-sidebar-border backdrop-blur-sm">
              <Avatar className="size-9 border-2 border-primary/20">
                <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-caption">
                  {user?.full_name?.charAt(0).toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-bold text-sidebar-foreground truncate leading-none mb-1">{user?.full_name || 'Admin User'}</p>
                <p className="text-caption font-medium text-sidebar-text uppercase tracking-wider truncate">{user?.role?.replace('_', ' ') || 'Manager'}</p>
              </div>
              <button 
                onClick={() => logout()}
                className="size-10 flex items-center justify-center rounded-xl bg-sidebar-danger/10 border border-sidebar-danger/20 text-sidebar-danger hover:bg-danger hover:text-danger-foreground hover:border-transparent transition-all shadow-lg shadow-danger/10 group shrink-0"
                title={tAuth('logout')}
              >
                <LogOut className="size-5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => logout()}
              className="w-full size-12 flex items-center justify-center rounded-2xl bg-sidebar-danger/10 border border-sidebar-danger/20 text-sidebar-danger hover:bg-danger hover:text-danger-foreground hover:border-transparent transition-all shadow-lg shadow-danger/10 group"
              title={tAuth('logout')}
            >
              <LogOut className="size-6 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
        
      </div>
    </aside>
  );
}
