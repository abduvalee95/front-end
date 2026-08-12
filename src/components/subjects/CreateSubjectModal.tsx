'use client';

import { useState } from 'react';
import { useTranslations } from '@/i18n/index';
import { toast } from 'sonner';
import { BookOpen, Loader2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateSubject } from '@/hooks/useSubjects';

interface CreateSubjectModalProps {
  open?: boolean;
  onClose?: () => void;
}

export function CreateSubjectModal({ open: externalOpen, onClose }: CreateSubjectModalProps = {}) {
  const isControlled = externalOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled
    ? (val: boolean) => { if (!val) onClose?.(); }
    : setInternalOpen;

  const t = useTranslations('subjects');
  const tCommon = useTranslations('common');
  const [name, setName] = useState('');
  const createSubject = useCreateSubject();

  const resetForm = () => setName('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t('name_required'));
      return;
    }

    try {
      await createSubject.mutateAsync({ name: name.trim() });
      toast.success(tCommon('success'));
      resetForm();
      setOpen(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || tCommon('error'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger
          render={
            <Button className="gap-2 bg-primary hover:bg-primary text-white shadow-lg shadow-primary/20 rounded-xl h-10 px-5">
              <Plus className="size-4" />
              {t('add_subject')}
            </Button>
          }
        />
      )}
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-emphasis">
              <BookOpen className="size-5" />
            </div>
            <div>
              <DialogTitle>{t('add_subject')}</DialogTitle>
              <DialogDescription>{t('subtitle')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="subject-name">{t('subject_name')} *</Label>
            <Input
              id="subject-name"
              placeholder={t('subject_name_placeholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createSubject.isPending}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createSubject.isPending}
              className="w-full sm:w-auto rounded-xl"
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={createSubject.isPending}
              className="w-full sm:w-auto rounded-xl"
            >
              {createSubject.isPending ? (
                <><Loader2 className="mr-2 size-4 animate-spin" />{t('creating')}</>
              ) : t('create_subject')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
