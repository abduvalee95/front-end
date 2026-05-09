'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Calendar, 
  BookOpen, 
  ClipboardCheck, 
  BarChart3, 
  UserPlus,
  Settings,
  CreditCard,
  LogOut,
  ChevronLeft,
  Menu
} from 'lucide-react';

const navigationGroups = [
  {
    title: 'Main',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Management',
    items: [
      { name: 'Journal', href: '/journal', icon: BookOpen },
      { name: 'Leads', href: '/leads', icon: Users },
      { name: 'Teachers', href: '/teachers', icon: GraduationCap },
      { name: 'Students', href: '/students', icon: GraduationCap },
    ]
  },
  {
    title: 'Academic',
    items: [
      { name: 'Attendance', href: '/attendance', icon: ClipboardCheck },
      { name: 'Schedule', href: '/schedule', icon: Calendar },
    ]
  },
  {
    title: 'System',
    items: [
      { name: 'Reports', href: '/reports', icon: BarChart3 },
      { name: 'Finance', href: '/payments', icon: CreditCard },
      { name: 'Settings', href: '/settings', icon: Settings },
    ]
  }
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuth();

  return (
    <aside 
      className={cn(
        "relative z-20 flex h-screen flex-col border-r border-white/5 shadow-2xl transition-all duration-500 ease-in-out",
        "text-white backdrop-blur-md", 
        isCollapsed ? "w-[80px]" : "w-[260px]"
      )}
      style={{ background: 'linear-gradient(180deg, #0f172af5, #1e3a8af5)' }}
    >
      {/* Sidebar Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 size-6 bg-blue-500 rounded-full flex items-center justify-center border border-white/10 shadow-lg hover:scale-110 transition-transform z-30"
      >
        {isCollapsed ? <Menu className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
      </button>

      {/* Subtle glow to keep it premium */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.1),transparent_15rem)]" />
      
      {/* Brand Section */}
      <div className={cn(
        "flex flex-col items-center pt-10 pb-6 px-4 relative transition-all duration-500",
        isCollapsed ? "px-2" : "px-4"
      )}>
        <div className="flex size-30 items-center justify-center rounded-2x  shadow-xl mb-4 transition-transform hover:scale-105 shrink-0">
          <Image src="/logo.svg" alt="Logo" width={152} height={153} className="object-contain brightness-0 invert" priority /> 
        </div>
        {!isCollapsed && (
          <div className="text-center animate-in fade-in duration-300">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200/60 mb-1.5">
              ОКУУ БОРБОРУ
            </p>
            <h2 className="font-bold text-2xl leading-none text-white mb-2">
              Билим Нуру
            </h2>
            <p className="text-[11px] text-blue-100/70 leading-tight max-w-[170px] mx-auto font-medium">
              Управление оплатами и учениками
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="scrollbar-hide relative flex-1 overflow-y-auto px-4 py-2 space-y-6">
        {navigationGroups.map((group) => (
          <div key={group.title} className="space-y-1.5">
            {!isCollapsed && (
              <div className="px-4 mb-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200/30">
                  {group.title}
                </p>
              </div>
            )}
            <nav className="flex flex-col space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group relative text-[14px] font-semibold",
                      isActive 
                        ? "bg-gradient-to-r from-blue-400 to-cyan-400 text-white shadow-lg shadow-blue-500/30"
                        : "text-blue-100/60 hover:bg-white/5 hover:text-white",
                      isCollapsed && "justify-center px-2"
                    )}
                    aria-label={item.name}
                  >
                    <item.icon className={cn("size-5 shrink-0 transition-colors", isActive ? "text-white" : "text-blue-200/40 group-hover:text-blue-200")} />
                    {!isCollapsed && <span>{item.name}</span>}
                    {isCollapsed && (
                      <div className="absolute left-full ml-4 px-2 py-1 bg-[#22315e] border border-white/10 rounded-md text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                        {item.name}
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
                title="Log out"
              >
                <LogOut className="size-5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => logout()}
              className="w-full size-12 flex items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10 group"
              title="Log out"
            >
              <LogOut className="size-6 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
        
      </div>
    </aside>
  );
}
