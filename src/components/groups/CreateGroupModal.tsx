'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Plus, Users2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
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
import { useTranslations } from '@/i18n/index';
import { groupService } from '@/services/groups';
import { GROUPS_KEYS } from '@/hooks/useGroups';
import { useCourses } from '@/hooks/useCourses';
import { useTeachers } from '@/hooks/useTeachers';

interface CreateGroupModalProps {
  open?: boolean;
  onClose?: () => void;
}

export function CreateGroupModal({ open: externalOpen, onClose }: CreateGroupModalProps = {}) {
  const t = useTranslations('groups');
  const tCommon = useTranslations('common');
  const isControlled = externalOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled
    ? (val: boolean) => { if (!val) onClose?.(); }
    : setInternalOpen;
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const coursesQuery = useCourses(open);
  const teachersQuery = useTeachers({ page: 1, limit: 100 }, open);

  const [formData, setFormData] = useState({
    name: '',
    course_id: '',
    teacher_id: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
  });

  const resetForm = () => setFormData({ name: '', course_id: '', teacher_id: '', start_date: '', end_date: '', start_time: '', end_time: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, course_id, teacher_id, start_date, end_date, start_time, end_time } = formData;
    if (!name.trim() || !course_id || !teacher_id || !start_date || !end_date || !start_time || !end_time) {
      toast.error(t('fill_all_fields'));
      return;
    }

    try {
      setIsLoading(true);
      await groupService.createGroup(formData);
      toast.success(t('group_created'));
      resetForm();
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: GROUPS_KEYS.all(user?.organization_id) });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t('group_create_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const courses = coursesQuery.data ?? [];
  const teachers = teachersQuery.data?.items ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger
          render={
            <Button className="gap-2 bg-card text-white shadow-md hover:bg-card dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 rounded-xl h-10 px-5">
              <Plus className="size-4" />
              {t('add_group')}
            </Button>
          }
        />
      )}
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users2 className="size-5" />
            </div>
            <div>
              <DialogTitle>{t('create_group')}</DialogTitle>
              <DialogDescription>
                {t('create_group_desc')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="group-name">{t('group_name')} *</Label>
            <Input
              id="group-name"
              placeholder={t('group_name_placeholder')}
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-course">{t('course')} *</Label>
            <select
              id="group-course"
              value={formData.course_id}
              onChange={(e) => setFormData((p) => ({ ...p, course_id: e.target.value }))}
              disabled={isLoading}
              className="flex h-9 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
            >
              <option value="">{t('select_course')}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-teacher">{t('teacher')} *</Label>
            <select
              id="group-teacher"
              value={formData.teacher_id}
              onChange={(e) => setFormData((p) => ({ ...p, teacher_id: e.target.value }))}
              disabled={isLoading}
              className="flex h-9 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
            >
              <option value="">{t('select_teacher')}</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.full_name ?? 'Teacher'}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="group-start">{t('start_date')} *</Label>
              <Input
                id="group-start"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData((p) => ({ ...p, start_date: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-end">{t('end_date')} *</Label>
              <Input
                id="group-end"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData((p) => ({ ...p, end_date: e.target.value }))}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="group-start-time">{t('start_time')} *</Label>
              <Input
                id="group-start-time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData((p) => ({ ...p, start_time: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-end-time">{t('end_time')} *</Label>
              <Input
                id="group-end-time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData((p) => ({ ...p, end_time: e.target.value }))}
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading} className="w-full sm:w-auto rounded-xl">
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto rounded-xl">
              {isLoading ? <><Loader2 className="mr-2 size-4 animate-spin" />{t('creating')}</> : t('create_group')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
