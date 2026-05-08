'use client';

import { usePathname } from 'next/navigation';
import { Menu, Bell, Settings, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  organizations: 'Organizations',
  users: 'Users',
  settings: 'Settings',
};

interface AdminHeaderProps {
  onMobileMenuToggle: () => void;
}

export function AdminHeader({ onMobileMenuToggle }: AdminHeaderProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const segments = pathname
    .replace('/admin/', '')
    .split('/')
    .filter(Boolean);

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'SA';

  return (
    <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center justify-between border-b border-border/70 bg-background/72 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex flex-1 items-center gap-4 lg:gap-8">
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className={cn('size-8 md:hidden')}
          onClick={onMobileMenuToggle}
          aria-label="Open menu"
        >
          <Menu className="size-4" />
        </Button>

        {/* Mobile brand name */}
        <span className="text-sm font-semibold md:hidden">SuperAdmin</span>

        {/* Desktop breadcrumb */}
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/dashboard" className="text-muted-foreground font-medium">
                Admin
              </BreadcrumbLink>
            </BreadcrumbItem>
            {segments.map((seg, i) => {
              const isLast = i === segments.length - 1;
              const label = routeLabels[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1);
              return (
                <span key={seg} className="flex items-center gap-1.5">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-bold text-foreground">{label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={`/admin/${seg}`} className="text-muted-foreground font-medium">
                        {label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative rounded-xl text-muted-foreground hover:text-primary">
          <Bell className="size-5" />
          <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-background bg-red-500" />
        </Button>
        <ThemeToggle className="rounded-xl text-muted-foreground hover:text-primary" />
        <div className="mx-1 hidden h-8 w-px bg-border sm:block" />
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold leading-none text-foreground">{user?.full_name ?? 'Super Admin'}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{user?.role ?? 'Platform Admin'}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" aria-label="User menu" />
              }
            >
              <Avatar className="size-10 rounded-xl border border-primary/15 bg-primary/10 text-primary shadow-inner" size="lg">
                <AvatarFallback className="rounded-xl bg-primary/10 font-bold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/50 bg-card/95 backdrop-blur-xl shadow-xl">
              <div className="px-3 py-2">
                <p className="text-sm font-bold truncate">{user?.full_name ?? 'Super Admin'}</p>
                <p className="text-xs font-medium text-muted-foreground truncate mt-0.5">{user?.email ?? ''}</p>
              </div>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem className="cursor-pointer focus:bg-primary/10 focus:text-primary rounded-lg mx-1">
                <User className="mr-2 size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-primary/10 focus:text-primary rounded-lg mx-1">
                <Settings className="mr-2 size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem
                className="cursor-pointer text-rose-500 focus:bg-rose-500/10 focus:text-rose-500 rounded-lg mx-1"
                onClick={() => logout()}
              >
                <LogOut className="mr-2 size-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
