'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-xl mx-auto mt-20 text-center space-y-4">
      <div className="inline-flex h-16 w-16 rounded-2xl bg-danger/10 text-danger-emphasis items-center justify-center">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="text-h1">Analytics failed to load</h1>
      <p className="text-body text-muted-foreground">{error.message || 'Unexpected error.'}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
