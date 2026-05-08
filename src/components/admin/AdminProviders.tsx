'use client';

import { SessionProvider } from '@/components/auth/SessionProvider';

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
