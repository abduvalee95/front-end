/**
 * Session Provider
 * Client component for session restoration and auth state management
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { restoreSession } from '@/lib/auth/session';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/i18n';
import { silentRefreshManager } from '@/lib/auth/silent-refresh';
import { resumeTenantRefresh } from '@/lib/auth/tenant-refresh';

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const router = useRouter();
  const t = useTranslations('common');
  const errors = useTranslations('errors');
  const { isHydrated, setLoading } = useAuthStore();

  const [verified, setVerified] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;
    const controller = new AbortController();
    let active = true;

    const initSession = async () => {
      // Try to restore session
      resumeTenantRefresh();
      setLoading(true);
      const result = await restoreSession(controller.signal);
      if (!active || controller.signal.aborted) return;
      setLoading(false);

      if (result.cancelled) return;

      if (result.success && result.user) {
        // Start silent refresh for the new session
        setVerified(true);
        silentRefreshManager.start(Date.now());
      } else if (result.retryable) {
        setUnavailable(true);
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
      active = false;
      controller.abort();
      setLoading(false);
      silentRefreshManager.stop();
    };
  }, [isHydrated, router, setLoading, attempt]);

  // Show loading state while checking session
  if (!isHydrated || !verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          {unavailable ? <>
            <p role="alert" className="text-body text-muted-foreground">{errors('something_went_wrong')}</p>
            <Button onClick={() => { setUnavailable(false); setAttempt(value => value + 1); }}>{errors('try_again')}</Button>
          </> : <><Loader2 className="w-8 h-8 animate-spin text-primary" /><p className="text-body text-muted-foreground">{t('loading')}</p></>}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
