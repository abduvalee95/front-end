'use client';

import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { useAuthStore } from '@/store/auth.store';
import { Lock } from 'lucide-react';

export default function AnalyticsPage() {
  const user = useAuthStore((s) => s.user);

  // SUPER_ADMIN currently lacks access to org-scoped analytics endpoints.
  if (user?.role === 'SUPER_ADMIN') {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center space-y-4">
        <div className="inline-flex h-16 w-16 rounded-2xl bg-muted items-center justify-center">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Analytics not available</h1>
        <p className="text-sm text-muted-foreground">
          The analytics endpoints are scoped per organization and require an ADMIN, MANAGER, or
          TEACHER role. Sign in with an organization account to access this dashboard.
        </p>
      </div>
    );
  }

  return <AnalyticsDashboard />;
}
