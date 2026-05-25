import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DateRangeProvider } from "@/hooks/useAnalytics";
import { AICopilot } from "@/components/ai/AICopilotLazy";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <DateRangeProvider>
        <AuthGuard>
          <div className="dashboard-shell flex h-screen overflow-hidden relative bg-background">
            {/* Soft glow — adapts to theme */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full blur-[120px] pointer-events-none bg-blue-300/20 dark:bg-cyan-500/10" />

            {/* Sidebar — desktop only */}
            <div className="hidden lg:flex">
              <DashboardSidebar />
            </div>

            <main className="relative flex flex-1 flex-col overflow-y-auto scrollbar-hide scroll-momentum">
              <DashboardHeader />
              <div className="mx-auto w-full max-w-[1600px] flex-1 px-4 sm:px-6 lg:px-8 pb-12 pt-4 pb-mobile-nav">
                {children}
              </div>
            </main>
            <AICopilot />

            {/* Bottom nav — mobile/tablet only */}
            <BottomNav />
          </div>
        </AuthGuard>
      </DateRangeProvider>
    </SessionProvider>
  );
}
