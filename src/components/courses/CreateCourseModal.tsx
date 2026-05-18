'use client';

import { useState } from 'react';
import { useTranslations } from '@/i18n/index';
import { useQueryClient } from '@tanstack/react-query';
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
import { Textarea } from '@/components/ui/textarea';
import { courseService } from '@/services/courses';
import { queryKeys } from '@/lib/api/query-keys';
import { useAuthStore } from '@/store/auth.store';
import type { CourseStatus } from '@/types/group';

interface CreateCourseModalProps {
  open?: boolean;
  onClose?: () => void;
}

export function CreateCourseModal({ open: externalOpen, onClose }: CreateCourseModalProps = {}) {
  const isControlled = externalOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled
    ? (val: boolean) => { if (!val) onClose?.(); }
    : setInternalOpen;
  const t = useTranslations('courses');
  const tCommon = useTranslations('common');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    status: 'ACTIVE' as CourseStatus,
  });

  const resetForm = () => setFormData({ title: '', description: '', price: '', status: 'ACTIVE' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.price.trim()) {
      toast.error(t('title_price_required'));
      return;
    }

    try {
      setIsLoading(true);
      await courseService.createCourse({
        title: formData.title,
        description: formData.description || undefined,
        price: formData.price,
        status: formData.status,
      });
      toast.success(tCommon('course_created_success'));
      resetForm();
      setOpen(false);
      const user = useAuthStore.getState().user;
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all(user?.organization_id) });
    } catch (error: any) {
      toast.error(error.response?.data?.message || tCommon('failed_create_course'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger
          render={
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 rounded-xl h-10 px-5">
              <Plus className="size-4" />
              {t('add_course')}
            </Button>
          }
        />
      )}
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
              <BookOpen className="size-5" />
            </div>
            <div>
              <DialogTitle>{t('create_new_course')}</DialogTitle>
              <DialogDescription>
                {t('add_new_educational_program')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="course-title">{t('course_title')} *</Label>
            <Input
              id="course-title"
              placeholder={t('course_title_placeholder')}
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-desc">{tCommon('description')}</Label>
            <Textarea
              id="course-desc"
              placeholder={t('course_description_placeholder')}
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              disabled={isLoading}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course-price">{t('price')} *</Label>
              <Input
                id="course-price"
                type="number"
                placeholder={t('price_placeholder')}
                value={formData.price}
                onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-status">{tCommon('status')}</Label>
              <select
                id="course-status"
                value={formData.status}
                onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as CourseStatus }))}
                disabled={isLoading}
                className="flex h-9 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
              >
                <option value="ACTIVE">{tCommon('active')}</option>
                <option value="INACTIVE">{tCommon('inactive')}</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading} className="w-full sm:w-auto rounded-xl">
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto rounded-xl">
              {isLoading ? <><Loader2 className="mr-2 size-4 animate-spin" />{t('creating')}</> : t('create_course')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
