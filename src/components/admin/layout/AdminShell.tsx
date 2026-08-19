'use client';

import { useState } from 'react';
import { SidebarNav } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="admin-shell flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex shrink-0">
        <SidebarNav />
      </div>

      {/* Mobile sidebar — Sheet overlay */}
      <Sheet open={mobileOpen} onOpenChange={(open) => setMobileOpen(open)}>
        <SheetContent side="left" showCloseButton={false} className="w-[280px] p-0 border-r-0 bg-transparent">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav onNavClick={() => setMobileOpen(false)} isMobile />
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader onMobileMenuToggle={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
