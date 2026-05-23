import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DateRangeProvider } from "@/hooks/useAnalytics";
import { AICopilot } from "@/components/ai/AICopilot";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <DateRangeProvider>
        <AuthGuard>
          <div
            className="flex h-screen overflow-hidden relative"
            style={{ background: 'linear-gradient(to top, #f3e7e9 0%, #e3eeff 99%, #e3eeff 100%)' }}
          >
            {/* Soft blue glow matching the image */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-blue-300/20 rounded-full blur-[120px] pointer-events-none" />

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
