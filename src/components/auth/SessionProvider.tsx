/**
 * Session Provider
 * Client component for session restoration and auth state management
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { restoreSession } from '@/lib/auth/session';
import { silentRefreshManager } from '@/lib/auth/silent-refresh';

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const router = useRouter();
  const { isHydrated, isAuthenticated, setLoading } = useAuthStore();

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    const initSession = async () => {
      // If already authenticated, just start silent refresh
      if (isAuthenticated) {
        silentRefreshManager.start(Date.now());
        return;
      }

      // Try to restore session
      setLoading(true);
      const result = await restoreSession();
      setLoading(false);

      if (result.success && result.user) {
        // Start silent refresh for the new session
        silentRefreshManager.start(Date.now());
      } else {
        // No valid session - redirect to login
        const currentPath = window.location.pathname;
        if (currentPath !== '/login') {
          router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
        }
      }
    };

    // Wait for hydration
    if (isHydrated) {
      initSession();
    }

    // Cleanup on unmount
    return () => {
      silentRefreshManager.stop();
    };
  }, [isHydrated, isAuthenticated, router, setLoading]);

  // Show loading state while checking session
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-body text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
