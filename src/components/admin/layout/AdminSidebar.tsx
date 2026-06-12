'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from '@/i18n/index';
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Nav items are translated dynamically in component

interface SidebarNavProps {
  onNavClick?: () => void;
  isMobile?: boolean;
}

export function SidebarNav({ onNavClick, isMobile }: SidebarNavProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout, user } = useAuth();
  const tNav = useTranslations('nav');
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
  
  const navItems = [
    {
      group: tCommon('main'),
      items: [
        { key: 'dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { key: 'organizations', href: '/admin/organizations', icon: Building2 },
      ],
    },
    {
      group: tCommon('system'),
      items: [
        { key: 'users', href: '/admin/users', icon: Users },
        { key: 'settings', href: '/admin/settings', icon: Settings },
      ],
    },
  ];

  const collapsed = isMobile ? false : isCollapsed;

  return (
    <aside className={cn(
      "relative z-20 flex h-full flex-col border-r border-white/10 shadow-2xl transition-all duration-500 ease-in-out",
      "bg-[linear-gradient(165deg,#07111f_0%,#0c2733_48%,#07111f_100%)] text-slate-200",
      collapsed ? "w-[80px]" : "w-[280px]"
    )}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(3,203,231,0.28),transparent_18rem),radial-gradient(circle_at_90%_68%,rgba(0,236,129,0.16),transparent_16rem)]" />
      {/* faint console grid texture */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className={cn('relative flex h-28 items-center px-5', collapsed ? 'justify-center' : 'gap-3')}>
        <div className={cn(
          'group relative flex items-center justify-center overflow-hidden rounded-2xl transition-all duration-500',
          'bg-gradient-to-br from-cyan-500/15 to-emerald-500/5',
          'border border-white/10 shadow-2xl backdrop-blur-md',
          'size-12 shrink-0'
        )}>
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/20 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
          <Image
            src="/logo.svg"
            alt="Logo"
            width={28}
            height={28}
            className="relative z-10 object-contain opacity-90 brightness-0 invert transition-transform duration-500 group-hover:scale-110"
            priority
          />
        </div>
        {!collapsed && (
          <div className="min-w-0 animate-in fade-in slide-in-from-left-2 duration-500">
            <p className="truncate text-[15px] font-black leading-none tracking-tight text-white">Bilim Nuru</p>
            <p className="mt-1.5 truncate font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-cyan-300/70">
              Platform Console
            </p>
          </div>
        )}
      </div>

      <div className="scrollbar-hide relative flex-1 space-y-8 overflow-y-auto px-4 py-4">
        {navItems.map((group) => (
          <div key={group.group}>
            {!collapsed && (
              <h3 className="mb-4 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200/55 animate-in fade-in duration-500">
                {group.group === tCommon('main') ? tCommon('main') : group.group === tCommon('system') ? tCommon('system') : group.group}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const label = tNav(item.key as Parameters<typeof tNav>[0]);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={onNavClick}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative",
                      isActive 
                        ? "border border-cyan-200/20 bg-white/12 text-white shadow-[0_18px_46px_rgba(3,203,231,0.12)] backdrop-blur-md before:absolute before:left-2 before:top-1/2 before:size-1.5 before:-translate-y-1/2 before:rounded-full before:bg-cyan-300"
                        : "border border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white hover:backdrop-blur-sm"
                    )}
                    aria-label={label}
                  >
                    <item.icon className={cn(
                      "size-5 shrink-0 transition-transform duration-300 group-hover:scale-110",
                      isActive ? "text-cyan-100 drop-shadow-[0_0_8px_rgba(103,216,232,0.5)]" : "text-slate-400 group-hover:text-white"
                    )} />
                    {!collapsed && <span className="font-medium text-sm">{label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="relative border-t border-white/10 bg-black/22 p-4 backdrop-blur-md">
        {!collapsed && (
          <div className="mb-3 flex items-center justify-between rounded-xl border border-emerald-400/15 bg-emerald-400/5 px-3 py-2">
            <span className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300/80">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
              </span>
              System Online
            </span>
            <span className="font-mono text-[10px] font-bold text-emerald-300/60">99.9%</span>
          </div>
        )}
        <div className="mb-2 flex items-center gap-3 px-3 py-3">
          <Avatar className="size-10 shrink-0 rounded-xl border border-white/20 bg-gradient-to-tr from-cyan-500 to-emerald-400 font-bold text-white shadow-inner" size="lg">
            {user?.avatar_url && <AvatarImage src={user.avatar_url} alt="Profile" />}
            <AvatarFallback className="rounded-xl bg-transparent font-bold text-white">
              {user?.full_name?.charAt(0) || 'S'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 animate-in fade-in duration-500">
              <p className="truncate text-sm font-bold text-white">{user?.full_name || 'Super Admin'}</p>
              <p className="truncate text-[10px] uppercase tracking-wider text-cyan-200/70">{user?.email || 'admin@platform.com'}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          {!isMobile && (
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center justify-center h-10 rounded-xl hover:bg-white/10 transition-colors border border-white/10 text-slate-300 hover:text-white backdrop-blur-sm"
              title={tCommon('toggle_sidebar')}
              aria-label={tCommon('toggle_sidebar')}
            >
              {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </button>
          )}
          <button 
            onClick={() => logout()}
            className={cn("flex items-center justify-center h-10 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all border border-red-500/20 backdrop-blur-sm", isMobile ? "col-span-2" : "")}
            title={tAuth('logout')}
            aria-label={tAuth('logout')}
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
