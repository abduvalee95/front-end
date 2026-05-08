'use client';

import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { PlatformOrganization } from '@/types/platform';

interface StatusConfirmDialogProps {
  org: PlatformOrganization | null;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function StatusConfirmDialog({ org, isLoading, onConfirm, onCancel }: StatusConfirmDialogProps) {
  if (!org) return null;

  const isDeactivating = org.status === 'ACTIVE';

  return (
    <AlertDialog open={!!org} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <div className="h-1 edu-gradient-accent -mx-6 -mt-6 mb-4 rounded-t-lg" />
        <AlertDialogHeader>
          <AlertDialogMedia
            className={cn(
              isDeactivating
                ? 'bg-destructive/10 text-destructive'
                : 'bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400',
            )}
          >
            {isDeactivating
              ? <AlertTriangle className="size-5" />
              : <CheckCircle2 className="size-5" />
            }
          </AlertDialogMedia>
          <AlertDialogTitle>
            {isDeactivating ? 'Deactivate Organization?' : 'Activate Organization?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDeactivating
              ? `"${org.name}" will lose platform access. You can reactivate it later.`
              : `"${org.name}" will be restored to active status.`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            render={
              <Button
                disabled={isLoading}
                className={isDeactivating ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'edu-gradient-btn rounded-lg'}
              />
            }
            onClick={onConfirm}
          >
            {isLoading && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            {isDeactivating ? 'Deactivate' : 'Activate'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
