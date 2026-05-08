'use client';

import { Loader2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { TeacherProfile } from '@/types/teacher';

interface TeacherStatusConfirmDialogProps {
  teacher: TeacherProfile | null;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TeacherStatusConfirmDialog({
  teacher,
  isLoading,
  onConfirm,
  onCancel,
}: TeacherStatusConfirmDialogProps) {
  if (!teacher) return null;

  const isDeactivating = teacher.status === 'ACTIVE';

  return (
    <Dialog open={!!teacher} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className={`size-5 ${isDeactivating ? 'text-destructive' : 'text-primary'}`} />
            {isDeactivating ? 'Deactivate Teacher' : 'Activate Teacher'}
          </DialogTitle>
          <DialogDescription className="pt-2">
            Are you sure you want to {isDeactivating ? 'deactivate' : 'activate'}{' '}
            <span className="font-semibold text-foreground">{teacher.user?.full_name}</span>?
          </DialogDescription>
        </DialogHeader>

        {isDeactivating && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20 mt-2">
            <p className="font-medium mb-1">Warning:</p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>They will not be able to log into the platform.</li>
              <li>They will not be assigned to new groups.</li>
              <li>Past data and history will be preserved.</li>
            </ul>
          </div>
        )}

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={isDeactivating ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isLoading}
            className={!isDeactivating ? 'edu-gradient-btn' : ''}
          >
            {isLoading && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            {isDeactivating ? 'Yes, Deactivate' : 'Yes, Activate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
