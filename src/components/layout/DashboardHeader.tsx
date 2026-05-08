'use client';

import { Search, Bell, Moon, Sun, Command, Plus, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export function DashboardHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={cn(
      "sticky top-0 z-30 flex h-20 w-full items-center justify-between px-8 transition-all duration-300",
      isScrolled ? "bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50" : "bg-transparent"
    )}>
      {/* Left: Search Bar */}
      <div className="flex flex-1 items-center max-w-md">
        <div className="relative w-full group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="size-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <Input 
            type="text" 
            placeholder="Search students, teachers, classes..." 
            className="w-full h-11 pl-12 pr-16 bg-white border-slate-200/60 rounded-2xl shadow-sm focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all placeholder:text-slate-400 font-medium"
          />
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200 rounded-lg">
              <Command className="size-3" /> K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Quick Help */}
        <Button variant="ghost" size="icon" className="size-11 rounded-2xl text-slate-500 hover:bg-slate-100 transition-colors">
          <HelpCircle className="size-5.5" />
        </Button>

        {/* Theme Toggle */}
        <div className="size-11 bg-white border border-slate-200/60 rounded-2xl shadow-sm flex items-center justify-center transition-all hover:bg-slate-50">
          <ThemeToggle />
        </div>

        {/* Notifications */}
        <div className="relative group">
          <Button variant="ghost" size="icon" className="size-11 rounded-2xl text-slate-500 hover:bg-slate-100 transition-colors">
            <Bell className="size-5.5" />
            <span className="absolute top-2.5 right-2.5 size-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse" />
          </Button>
          
          {/* Notification Badge/Dropdown Placeholder */}
          <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-[24px] shadow-2xl border border-slate-100 p-4 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all z-50">
            <div className="flex items-center justify-between mb-4 px-1">
              <h4 className="font-black text-slate-900">Notifications</h4>
              <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">3 NEW</span>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">
                  <div className="size-10 bg-blue-50 rounded-lg shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">New student enrollment</p>
                    <p className="text-[10px] text-slate-400 font-medium">2 minutes ago</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-xs font-bold text-slate-400 hover:text-slate-600">
              Mark all as read
            </Button>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-200 mx-1" />

        {/* Quick Action Button */}
        <Button className="h-11 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/20 gap-2 transition-all hover:scale-[1.02] active:scale-95">
          <Plus className="size-4.5" />
          <span>Quick Create</span>
        </Button>
      </div>
    </header>
  );
}
