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
import { useTranslations } from '@/i18n/index';
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
  const t = useTranslations('teachers');
  const tCommon = useTranslations('common');
  if (!teacher) return null;

  const isDeactivating = teacher.status === 'ACTIVE';

  return (
    <Dialog open={!!teacher} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className={`size-5 ${isDeactivating ? 'text-destructive' : 'text-primary'}`} />
            {isDeactivating ? t('deactivate_teacher') : t('activate_teacher')}
          </DialogTitle>
          <DialogDescription className="pt-2">
            <span className="font-semibold text-foreground">{teacher.full_name}</span>{' '}
            {isDeactivating ? t('deactivate') : t('activate')}?
          </DialogDescription>
        </DialogHeader>

        {isDeactivating && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20 mt-2">
            <p className="font-medium mb-1">{t('warning')}</p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>{t('deactivate_warning_1')}</li>
              <li>{t('deactivate_warning_2')}</li>
              <li>{t('deactivate_warning_3')}</li>
            </ul>
          </div>
        )}

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {tCommon('cancel')}
          </Button>
          <Button
            type="button"
            variant={isDeactivating ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isLoading}
            className={!isDeactivating ? 'edu-gradient-btn' : ''}
          >
            {isLoading && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            {isDeactivating ? t('yes_deactivate') : t('yes_activate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
