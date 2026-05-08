/**
 * Global Providers
 * TanStack Query and other context providers
 */

'use client';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';

export function Providers({ children }: { children: ReactNode }) {
  // Create QueryClient once per session
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minut davomida keshdan oladi
        gcTime: 10 * 60 * 1000,   // Foydalanilmagan ma'lumotlarni 10 minut saqlaydi
        refetchOnWindowFocus: false, // Oynaga qaytganda qayta yuklamaydi
        refetchOnReconnect: true,
        retry: 1,
      },
    },
  }));

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
