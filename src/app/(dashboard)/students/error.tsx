'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { RouteError } from '@/components/ui/route-error';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function StudentsError({ error, reset }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return <RouteError error={error} reset={reset} />;
}
