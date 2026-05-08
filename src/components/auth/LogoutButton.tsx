/**
 * Logout Button Component
 * Reusable logout button with confirmation and loading states
 */

'use client';

import { useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'secondary' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  className?: string;
  onLogout?: () => void;
}

export function LogoutButton({
  variant = 'ghost',
  size = 'default',
  showIcon = true,
  className,
  onLogout,
}: LogoutButtonProps) {
  const { logout, isLoading } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowConfirm(false), 3000);
      return;
    }

    await logout();
    onLogout?.();
  };

  return (
    <Button
      variant={showConfirm ? 'destructive' : (variant ?? 'default')}
      size={size}
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Logging out...
        </>
      ) : showConfirm ? (
        <>
          {showIcon && <LogOut className="w-4 h-4 mr-2" />}
          Click again to confirm
        </>
      ) : (
        <>
          {showIcon && <LogOut className="w-4 h-4 mr-2" />}
          Logout
        </>
      )}
    </Button>
  );
}
