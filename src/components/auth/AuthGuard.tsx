'use client';

import { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isLoading, isHydrated } = useAuth();

  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-slate-500">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
