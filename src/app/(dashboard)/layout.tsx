'use client';

import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Loader2 } from "lucide-react";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { useAuth } from "@/hooks/useAuth";
import { DateRangeProvider } from "@/hooks/useAnalytics";
import { AICopilot } from "@/components/ai/AICopilot";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isHydrated } = useAuth();

  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-slate-500">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex h-screen overflow-hidden relative" 
      style={{ background: 'linear-gradient(to top, #f3e7e9 0%, #e3eeff 99%, #e3eeff 100%)' }}
    >
      {/* Soft blue glow matching the image */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-blue-300/20 rounded-full blur-[120px] pointer-events-none" />
      
      <DashboardSidebar />
      <main className="relative flex flex-1 flex-col overflow-y-auto scrollbar-hide">
        <DashboardHeader />
        <div className="mx-auto w-full max-w-[1600px] flex-1 px-8 pb-12 pt-4">
          {children}
        </div>
      </main>
      <AICopilot />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <DateRangeProvider>
        <DashboardContent>{children}</DashboardContent>
      </DateRangeProvider>
    </SessionProvider>
  );
}
