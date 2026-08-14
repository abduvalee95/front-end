'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useTranslations } from '@/i18n';
import { logger } from '@/lib/logger';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  const t = useTranslations('errors');

  useEffect(() => {
    logger.error('Route segment error:', error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-danger/10">
          <AlertTriangle className="size-8 text-danger-emphasis" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-h1 tracking-tight text-foreground">
            {t('something_went_wrong')}
          </h2>
          <p className="text-body text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {t('try_again')}
          </p>
          {process.env.NODE_ENV === 'development' && error.message && (
            <pre className="mt-4 rounded-xl border border-danger/30 bg-danger-muted p-3 text-left text-caption text-danger-emphasis dark:border-danger/30 dark:bg-danger-muted/30 dark:text-danger-emphasis overflow-auto max-h-32">
              {error.message}
            </pre>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-h4 text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            <RefreshCw className="size-4" />
            {t('try_again')}
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-h4 text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Home className="size-4" />
            {t('back_home')}
          </Link>
        </div>
      </div>
    </div>
  );
}
