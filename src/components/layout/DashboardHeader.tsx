'use client';

import { Bell, Plus, HelpCircle, User, LogOut, Settings, GraduationCap, Users, BookOpen, UserPlus, Users2 } from 'lucide-react';
import { useTranslations } from '@/i18n/index';
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { GlobalSearch } from '@/components/layout/GlobalSearch';
import { CreateStudentModal } from '@/components/students/CreateStudentModal';
import { CreateLeadModal } from '@/components/leads/CreateLeadModal';
import { CreateTeacherModal } from '@/components/dashboard/teachers/CreateTeacherModal';
import { CreateCourseModal } from '@/components/courses/CreateCourseModal';
import { CreateGroupModal } from '@/components/groups/CreateGroupModal';

export function DashboardHeader() {
  const t = useTranslations('header');
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuth();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  useEffect(() => {
    const scrollParent = document.querySelector('main');
    if (!scrollParent) return;
    const handleScroll = () => setIsScrolled(scrollParent.scrollTop > 10);
    scrollParent.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollParent.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={cn(
      "sticky top-0 z-40 flex h-[72px] w-full items-center justify-between px-6 lg:px-10 transition-all duration-500",
      isScrolled 
        ? "bg-background/70 backdrop-blur-2xl shadow-sm border-b border-border/50 supports-[backdrop-filter]:bg-background/40" 
        : "bg-transparent"
    )}>
      {/* Left: Global Search */}
      <div className="flex flex-1 items-center max-w-md">
        <GlobalSearch />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Quick Help */}
        <Button variant="ghost" size="icon" className="size-9 sm:size-10 rounded-full text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors">
          <HelpCircle className="size-5" />
        </Button>

        {/* Language Switcher */}
        <LanguageSwitcher className="size-9 sm:size-10 bg-transparent border border-border/30 rounded-full flex items-center justify-center p-0 transition-all hover:bg-muted/80 hover:border-border/60 text-muted-foreground hover:text-foreground hover:opacity-100" />

        {/* Theme Toggle */}
        <ThemeToggle className="size-9 sm:size-10 bg-transparent border border-border/30 rounded-full flex items-center justify-center p-0 transition-all hover:bg-muted/80 hover:border-border/60 text-muted-foreground hover:text-foreground hover:opacity-100" />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="size-9 sm:size-10 rounded-full text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors relative focus-visible:ring-0">
                <Bell className="size-5" />
                <span className="absolute top-2 right-2.5 size-2 bg-rose-500 border-2 border-background rounded-full animate-pulse" />
              </Button>
            }
          />
          
          <DropdownMenuContent align="end" className="w-[320px] p-4 rounded-3xl border-border/50 bg-background/95 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-4 px-1">
              <h4 className="font-bold text-foreground tracking-tight">{t('notifications')}</h4>
              <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-full uppercase tracking-wider">3 {t('new_notification')}</span>
            </div>
            
            <DropdownMenuGroup className="space-y-1">
              {[1, 2, 3].map((n) => (
                <DropdownMenuItem key={n} className="flex gap-3 p-2.5 focus:bg-muted/50 rounded-2xl transition-colors cursor-pointer group/item items-start">
                  <div className="size-10 bg-indigo-500/10 text-indigo-500 rounded-xl shrink-0 flex items-center justify-center group-hover/item:bg-indigo-500 group-hover/item:text-white transition-colors">
                    <Bell className="size-4" />
                  </div>
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground line-clamp-1">New student enrollment</p>
                    <p className="text-[10px] text-muted-foreground font-medium">2 minutes ago</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            
            <div className="mt-3 px-1">
              <Button variant="ghost" className="w-full h-9 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                {t('mark_all_read')}
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-6 w-px bg-border/50 mx-1.5 hidden sm:block" />

        {/* Quick Create Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button className="size-9 sm:size-10 p-0 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 hover:from-indigo-600 hover:to-cyan-500 text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95 border-0 focus-visible:ring-0">
                <Plus className="size-5" />
              </Button>
            }
          />
          
          <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-border/50 bg-background/95 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setIsStudentModalOpen(true)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer focus:bg-muted/50 transition-colors">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500"><GraduationCap className="size-4" /></div>
                <span className="font-medium text-sm">{t('add_student')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsLeadModalOpen(true)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer focus:bg-muted/50 transition-colors">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500"><Users className="size-4" /></div>
                <span className="font-medium text-sm">{t('add_lead')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsTeacherModalOpen(true)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer focus:bg-muted/50 transition-colors">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500"><UserPlus className="size-4" /></div>
                <span className="font-medium text-sm">{t('add_teacher')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsCourseModalOpen(true)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer focus:bg-muted/50 transition-colors">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500"><BookOpen className="size-4" /></div>
                <span className="font-medium text-sm">{t('add_course')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsGroupModalOpen(true)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer focus:bg-muted/50 transition-colors">
                <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-500"><Users2 className="size-4" /></div>
                <span className="font-medium text-sm">{t('add_group')}</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            nativeButton={false}
            render={
              <div className="flex items-center justify-center p-1 rounded-full bg-transparent hover:bg-muted/50 border border-transparent hover:border-border/50 shadow-sm cursor-pointer transition-all hover:scale-105 ml-0.5 sm:ml-1">
                <Avatar className="size-8 sm:size-9 border-2 border-background shadow-sm">
                  <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-cyan-500 text-white font-bold text-sm">
                    {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            }
          />
          
          <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl border-border/50 bg-background/95 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
            <div className="px-3 py-2 mb-2 bg-muted/30 rounded-xl">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Signed in as</p>
              <p className="text-sm font-bold text-foreground mt-0.5 line-clamp-1">{user?.email}</p>
            </div>
            
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => router.push('/profile')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer focus:bg-muted/50 transition-colors"
              >
                <User className="size-4 text-muted-foreground" />
                <span className="font-medium">{t('my_profile')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/settings')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer focus:bg-muted/50 transition-colors"
              >
                <Settings className="size-4 text-muted-foreground" />
                <span className="font-medium">{t('settings')}</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator className="my-1 bg-border/50" />
            
            <DropdownMenuItem onClick={() => logout()} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-rose-500 focus:text-rose-600 focus:bg-rose-500/10 transition-colors">
              <LogOut className="size-4" />
              <span className="font-medium">{t('logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Modals */}
      <CreateStudentModal open={isStudentModalOpen} onClose={() => setIsStudentModalOpen(false)} />
      <CreateLeadModal isOpen={isLeadModalOpen} onClose={() => setIsLeadModalOpen(false)} />
      <CreateTeacherModal open={isTeacherModalOpen} onClose={() => setIsTeacherModalOpen(false)} />
      <CreateCourseModal open={isCourseModalOpen} onClose={() => setIsCourseModalOpen(false)} />
      <CreateGroupModal open={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
    </header>
  );
}
