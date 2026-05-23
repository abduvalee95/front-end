'use client';

import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BookOpen, Loader2, Plus, UsersRound } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { studentService } from '@/services/students';
import { enrollmentService } from '@/services/enrollments';
import { useGroups } from '@/hooks/useGroups';
import { queryKeys } from '@/lib/api/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { getErrorMessage } from '@/lib/api/client';
import { useTranslations } from '@/i18n/index';

interface CreateStudentModalProps {
  open?: boolean;
  onClose?: () => void;
}

export function CreateStudentModal({ open: externalOpen, onClose }: CreateStudentModalProps = {}) {
  const isControlled = externalOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled
    ? (val: boolean) => { if (!val) onClose?.(); }
    : setInternalOpen;
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const orgId = user?.organization_id;
  const t = useTranslations('students');
  const tCommon = useTranslations('common');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    parent: '',
    groupId: '',
  });

  const { data: groupsData } = useGroups(open);
  const groups = useMemo(() => groupsData ?? [], [groupsData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim() || !formData.groupId) {
      toast.error(t('fill_required'));
      return;
    }

    try {
      setIsLoading(true);
      const { groupId, ...studentData } = formData;
      const res = await studentService.createStudent({
        ...studentData,
        status: 'ACTIVE',
      });

      await enrollmentService.create({ student_id: res.student.id, group_id: groupId });

      toast.success(t('created_success'));

      if (res.temporaryPassword) {
        toast.info(`${t('temp_password')}: ${res.temporaryPassword}`, { duration: 10000 });
      }

      setFormData({ name: '', phone: '', address: '', parent: '', groupId: '' });
      setOpen(false);

      queryClient.invalidateQueries({ queryKey: queryKeys.students.all(orgId) });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || t('failed_create'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger
          render={
            <Button className="gap-2 bg-slate-950 text-white shadow-md hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 rounded-xl h-10 px-5">
              <Plus className="size-4" />
              {t('add_student')}
            </Button>
          }
        />
      )}
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UsersRound className="size-5" />
            </div>
            <div>
              <DialogTitle>{t('create_student')}</DialogTitle>
              <DialogDescription>{t('create_student_desc')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">{t('full_name')} *</Label>
            <Input
              id="name"
              placeholder="Name and Surname"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t('phone')} *</Label>
            <Input
              id="phone"
              placeholder="+996 90 000 00 00"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">{t('address')} *</Label>
            <Input
              id="address"
              placeholder="Address"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parent">{t('parent_info')}</Label>
            <Input
              id="parent"
              placeholder="E.g. Father: +996 90 000 00 00"
              value={formData.parent}
              onChange={(e) => setFormData((prev) => ({ ...prev, parent: e.target.value }))}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <BookOpen className="size-3.5 text-muted-foreground" />
              {t('group')} *
            </Label>
            <Select
              value={formData.groupId}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, groupId: v ?? '' }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('select_group')} />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                    {g.course?.title ? ` — ${g.course.title}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="w-full sm:w-auto rounded-xl"
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto rounded-xl">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('creating')}
                </>
              ) : (
                t('create_student')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
