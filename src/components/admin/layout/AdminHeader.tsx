'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from '@/i18n/index';
import { Menu, Bell, Settings, LogOut, User, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

interface AdminHeaderProps {
  onMobileMenuToggle: () => void;
}

export function AdminHeader({ onMobileMenuToggle }: AdminHeaderProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const tNav = useTranslations('nav');
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');

  const routeLabels: Record<string, string> = {
    dashboard: tNav('dashboard'),
    organizations: tNav('organizations'),
    users: tNav('users'),
    settings: tNav('settings'),
  };

  const segments = pathname.replace('/admin/', '').split('/').filter(Boolean);
  const current = segments[segments.length - 1];
  const currentLabel = current
    ? routeLabels[current] ?? current.charAt(0).toUpperCase() + current.slice(1)
    : tNav('dashboard');

  const initials =
    user?.full_name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? 'SA';

  return (
    <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center justify-between border-b border-border/70 bg-background/72 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      {/* hairline cyan accent under the bar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="flex flex-1 items-center gap-3 lg:gap-5">
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="size-9 md:hidden"
          onClick={onMobileMenuToggle}
          aria-label={tCommon('open_menu')}
        >
          <Menu className="size-4" />
        </Button>

        {/* Console breadcrumb */}
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="hidden items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/70 md:flex">
            {tNav('admin')}
            <ChevronRight className="size-3 text-muted-foreground/40" />
          </span>
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            <h2 className="truncate text-base font-extrabold tracking-tight text-foreground sm:text-lg">
              {currentLabel}
            </h2>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-xl text-muted-foreground hover:text-primary"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-background bg-danger" />
        </Button>
        <ThemeToggle className="rounded-xl text-muted-foreground hover:text-primary" />
        <div className="mx-1 hidden h-8 w-px bg-border sm:block" />
        <div className="flex items-center gap-3 pl-1">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-bold leading-none text-foreground">{user?.full_name ?? 'Super Admin'}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-primary/80">
              {user?.role ?? 'PLATFORM'}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  className="flex items-center rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  aria-label={tCommon('user_menu')}
                />
              }
            >
              <Avatar
                className="size-10 rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-inner ring-1 ring-primary/10"
                size="lg"
              >
                <AvatarFallback className="rounded-xl bg-primary/10 font-bold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-52 rounded-xl border-border/60 bg-card/95 shadow-xl backdrop-blur-xl"
            >
              <div className="px-3 py-2.5">
                <p className="truncate text-sm font-bold">{user?.full_name ?? 'Super Admin'}</p>
                <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">{user?.email ?? ''}</p>
              </div>
              <DropdownMenuSeparator className="bg-border/60" />
              <DropdownMenuItem className="mx-1 cursor-pointer rounded-lg focus:bg-primary/10 focus:text-primary">
                <User className="mr-2 size-4" />
                {tCommon('profile')}
              </DropdownMenuItem>
              <DropdownMenuItem className="mx-1 cursor-pointer rounded-lg focus:bg-primary/10 focus:text-primary">
                <Settings className="mr-2 size-4" />
                {tNav('settings')}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/60" />
              <DropdownMenuItem
                className="mx-1 cursor-pointer rounded-lg text-danger-emphasis focus:bg-danger/10 focus:text-danger-emphasis"
                onClick={() => logout()}
              >
                <LogOut className="mr-2 size-4" />
                {tAuth('logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
