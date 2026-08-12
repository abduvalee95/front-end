'use client';

import { useState } from 'react';
import { useTranslations } from '@/i18n/index';
import { toast } from 'sonner';
import { BookOpen, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateSubject } from '@/hooks/useSubjects';
import type { Subject } from '@/types/subject';

interface EditSubjectModalProps {
  subject: Subject;
  open: boolean;
  onClose: () => void;
}

export function EditSubjectModal({ subject, open, onClose }: EditSubjectModalProps) {
  const t = useTranslations('subjects');
  const tCommon = useTranslations('common');
  const [name, setName] = useState(subject.name);
  const [prevOpen, setPrevOpen] = useState(open);
  const updateSubject = useUpdateSubject();

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setName(subject.name);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t('name_required'));
      return;
    }

    try {
      await updateSubject.mutateAsync({ id: subject.id, data: { name: name.trim() } });
      toast.success(tCommon('success'));
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || tCommon('error'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-emphasis">
              <BookOpen className="size-5" />
            </div>
            <div>
              <DialogTitle>{t('edit_subject')}</DialogTitle>
              <DialogDescription>{t('subtitle')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-subject-name">{t('subject_name')} *</Label>
            <Input
              id="edit-subject-name"
              placeholder={t('subject_name_placeholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={updateSubject.isPending}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateSubject.isPending}
              className="w-full sm:w-auto rounded-xl"
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={updateSubject.isPending}
              className="w-full sm:w-auto rounded-xl"
            >
              {updateSubject.isPending ? (
                <><Loader2 className="mr-2 size-4 animate-spin" />{t('creating')}</>
              ) : tCommon('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
