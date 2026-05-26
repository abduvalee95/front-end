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

type NavItem = {
  key: string;
  href: string;
  icon: LucideIcon;
  roles: string[] | null;
  comingSoon?: true;
};

const NAV_GROUPS: { groupKey: string; items: NavItem[] }[] = [
  {
    groupKey: 'group_main',
    items: [
      { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard, roles: null },
    ]
  },
  {
    groupKey: 'group_management',
    items: [
      { key: 'journal',  href: '/journal',  icon: NotebookPen,    roles: null },
      { key: 'leads',    href: '/leads',    icon: Users,          roles: ['SUPER_ADMIN','ADMIN','MANAGER','TEACHER'] },
      { key: 'courses',  href: '/courses',  icon: BookMarked,     roles: null },
      { key: 'teachers', href: '/teachers', icon: GraduationCap,  roles: ['SUPER_ADMIN','ADMIN','MANAGER'] },
      { key: 'students', href: '/students', icon: GraduationCap,  roles: null },
      { key: 'groups',   href: '/groups',   icon: UsersRound,     roles: ['SUPER_ADMIN','ADMIN','MANAGER','TEACHER'] },
    ]
  },
  {
    groupKey: 'group_academic',
    items: [
      { key: 'attendance', href: '/attendance', icon: ClipboardCheck, roles: null },
      { key: 'schedule',   href: '/schedule',   icon: Calendar,       roles: null },
    ]
  },
  {
    groupKey: 'group_system',
    items: [
      { key: 'reports',  href: '/reports',  icon: BarChart3, roles: ['SUPER_ADMIN','ADMIN','MANAGER'] },
      { key: 'finance',  href: '/finance',  icon: CreditCard,roles: ['SUPER_ADMIN','ADMIN','MANAGER'] },
      { key: 'settings', href: '/settings', icon: Settings,  roles: ['SUPER_ADMIN','ADMIN'] },
    ]
  }
];

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

  return (
    <aside
      className={cn(
        "dashboard-sidebar relative z-20 flex h-screen flex-col border-r shadow-2xl transition-all duration-500 ease-in-out",
        "text-white backdrop-blur-md",
        isCollapsed ? "w-[80px]" : "w-[260px]"
      )}
    >
      {/* Sidebar Toggle Button */}
      <button 
        onClick={handleToggle}
        className="absolute -right-3 top-10 size-6 bg-blue-500 rounded-full flex items-center justify-center border border-white/10 shadow-lg hover:scale-110 transition-transform z-30"
      >
        {isCollapsed ? <Menu className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
      </button>

      {/* Subtle glow to keep it premium */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.1),transparent_15rem)]" />
      
      {/* Brand Section */}
      <div className={cn(
        "flex flex-col items-center pt-8 pb-6 relative transition-all duration-500",
        isCollapsed ? "px-2" : "px-5"
      )}>
        {orgSettings?.logo_url ? (
          isCollapsed ? (
            <div className="size-12 rounded-xl overflow-hidden ring-2 ring-white/10 shadow-lg">
              <Image
                src={orgSettings.logo_url}
                alt={orgSettings.name}
                width={48}
                height={48}
                className="size-full object-cover"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 w-full">
              <div className="size-16 rounded-2xl overflow-hidden ring-2 ring-white/10 shadow-lg shadow-blue-900/30">
                <Image
                  src={orgSettings.logo_url}
                  alt={orgSettings.name}
                  width={64}
                  height={64}
                  className="size-full object-cover"
                />
              </div>
              <div className="text-center w-full px-1">
                <p className="text-[13px] font-bold text-white truncate leading-tight">{orgSettings.name}</p>
                <p className="text-[10px] text-blue-200/40 uppercase tracking-wider mt-0.5">Education Center</p>
              </div>
            </div>
          )
        ) : (
          <div className={cn(
            "flex items-center justify-center rounded-3xl transition-all duration-500 group relative overflow-hidden",
            isCollapsed ? "size-14" : "size-34"
          )}>
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
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
        )}
      </div>

      {/* Navigation */}
      <div className="scrollbar-hide relative flex-1 overflow-y-auto px-4 py-2 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.groupKey} className="space-y-1.5">
            {!isCollapsed && (
              <div className="px-4 mb-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200/30">
                  {tNav(group.groupKey as Parameters<typeof tNav>[0])}
                </p>
              </div>
            )}
            <nav className="flex flex-col space-y-1">
              {group.items.map((item) => {
                if (item.roles && !item.roles.includes(user?.role || '')) return null;

                const label = tNav(item.key as Parameters<typeof tNav>[0]);
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group relative text-[14px] font-semibold",
                      isActive
                        ? "bg-gradient-to-r from-blue-400 to-cyan-400 text-white shadow-lg shadow-blue-500/30"
                        : "text-blue-100/60 hover:bg-white/5 hover:text-white",
                      isCollapsed && "justify-center px-2",
                      item.comingSoon && "pointer-events-none opacity-50 cursor-not-allowed"
                    )}
                    aria-label={label}
                  >
                    <item.icon className={cn("size-5 shrink-0 transition-colors", isActive ? "text-white" : "text-blue-200/40 group-hover:text-blue-200")} />
                    {!isCollapsed && <span>{label}</span>}
                    {!isCollapsed && item.comingSoon && (
                      <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-blue-200/50 bg-white/5 px-1.5 py-0.5 rounded-full">Tez kunda</span>
                    )}
                    {isCollapsed && (
                      <div className="absolute left-full ml-4 px-2 py-1 bg-[#22315e] border border-white/10 rounded-md text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
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
      <div className="p-4 mt-auto border-t border-white/5 bg-blue-900/10">
        <div className="flex items-center gap-3">
          {!isCollapsed ? (
            <div className="flex flex-1 items-center gap-3 px-3 py-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
              <Avatar className="size-9 border-2 border-blue-400/20">
                <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
                <AvatarFallback className="bg-blue-600 text-white font-bold text-[10px]">
                  {user?.full_name?.charAt(0).toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-white truncate leading-none mb-1">{user?.full_name || 'Admin User'}</p>
                <p className="text-[10px] font-medium text-blue-200/40 uppercase tracking-wider truncate">{user?.role?.replace('_', ' ') || 'Manager'}</p>
              </div>
              <button 
                onClick={() => logout()}
                className="size-10 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10 group shrink-0"
                title={tAuth('logout')}
              >
                <LogOut className="size-5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => logout()}
              className="w-full size-12 flex items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10 group"
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
