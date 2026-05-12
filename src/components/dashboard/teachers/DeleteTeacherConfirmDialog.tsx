'use client';

import { Loader2, Trash2 } from 'lucide-react';
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

interface DeleteTeacherConfirmDialogProps {
  teacher: TeacherProfile | null;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteTeacherConfirmDialog({
  teacher,
  isLoading,
  onConfirm,
  onCancel,
}: DeleteTeacherConfirmDialogProps) {
  if (!teacher) return null;

  return (
    <Dialog open={!!teacher} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="size-5 text-destructive" />
            Delete Teacher
          </DialogTitle>
          <DialogDescription className="pt-2">
            Are you sure you want to permanently delete{' '}
            <span className="font-semibold text-foreground">{teacher.full_name}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20 mt-2">
          <p className="font-medium mb-1">The following will happen:</p>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>Teacher will be deactivated and hidden from the list.</li>
            <li>Teacher will no longer be assignable to new groups.</li>
            <li>Historical data (lessons, attendance) will be preserved.</li>
          </ul>
        </div>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            Yes, Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
