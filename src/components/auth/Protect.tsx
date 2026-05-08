'use client';

import { useAuthStore } from '@/store/auth.store';
import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ProtectProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
}

export function Protect({ children, allowedRoles, fallback }: ProtectProps) {
  const { user, isHydrated } = useAuthStore();

  // Wait for Zustand state to be hydrated from local storage
  if (!isHydrated) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is not logged in or doesn't have the required role
  if (!user || !allowedRoles.includes(user.role)) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }
    
    // Default fallback is to hide the content
    return null;
  }

  return <>{children}</>;
}
