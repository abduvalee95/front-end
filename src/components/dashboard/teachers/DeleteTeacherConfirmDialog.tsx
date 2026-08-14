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
import { useTranslations } from '@/i18n/index';
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
  const t = useTranslations('teachers');
  const tCommon = useTranslations('common');
  if (!teacher) return null;

  return (
    <Dialog open={!!teacher} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="size-5 text-destructive" />
            {t('delete_teacher')}
          </DialogTitle>
          <DialogDescription className="pt-2">
            <span className="font-semibold text-foreground">{teacher.full_name}</span>{' '}
            {t('delete_confirm')}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-destructive/10 text-destructive text-body p-3 rounded-lg border border-destructive/20 mt-2">
          <p className="font-medium mb-1">{t('delete_warning_title')}</p>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>{t('delete_warning_1')}</li>
            <li>{t('delete_warning_2')}</li>
            <li>{t('delete_warning_3')}</li>
          </ul>
        </div>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {tCommon('cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            {t('yes_delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
