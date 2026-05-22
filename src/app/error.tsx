'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logger } from '@/lib/logger';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    logger.error('Route segment error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-red-500/10">
          <AlertTriangle className="size-8 text-red-500" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Xatolik yuz berdi
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Kutilmagan xatolik yuz berdi. Iltimos, qayta urinib ko&apos;ring yoki bosh sahifaga qayting.
          </p>
          {process.env.NODE_ENV === 'development' && error.message && (
            <pre className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-left text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400 overflow-auto max-h-32">
              {error.message}
            </pre>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            <RefreshCw className="size-4" />
            Qayta urinish
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Home className="size-4" />
            Bosh sahifa
          </Link>
        </div>
      </div>
    </div>
  );
}
