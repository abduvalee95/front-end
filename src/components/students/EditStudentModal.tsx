'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, PenLine, UsersRound } from 'lucide-react';
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
import { queryKeys } from '@/lib/api/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { getErrorMessage } from '@/lib/api/client';
import type { Student, StudentStatus } from '@/types/student';
import { useTranslations } from '@/i18n/index';

interface EditStudentModalProps {
  student: Pick<Student, 'id' | 'name' | 'phone' | 'status'> & {
    address?: string;
    parent?: string;
  };
  trigger?: React.ReactElement;
}

export function EditStudentModal({ student, trigger }: EditStudentModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const orgId = user?.organization_id;
  const t = useTranslations('students');
  const tCommon = useTranslations('common');
  const tSettings = useTranslations('settings');

  const [formData, setFormData] = useState({
    name: student.name || '',
    phone: student.phone || '',
    address: student.address || '',
    parent: student.parent || '',
    status: student.status as StudentStatus,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
      toast.error(t('fill_required'));
      return;
    }

    try {
      setIsLoading(true);
      await studentService.updateStudent(student.id, formData);
      toast.success(t('updated_success'));
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all(orgId) });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || t('failed_update'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger || (
            <Button variant="ghost" size="icon" className="size-8">
              <PenLine className="size-4" />
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UsersRound className="size-5" />
            </div>
            <div>
              <DialogTitle>{t('edit_student')}</DialogTitle>
              <DialogDescription>{t('edit_student_desc')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor={`edit-name-${student.id}`}>{t('full_name')} *</Label>
            <Input
              id={`edit-name-${student.id}`}
              placeholder="E.g. Ali Valiyev"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-phone-${student.id}`}>{t('phone')} *</Label>
            <Input
              id={`edit-phone-${student.id}`}
              placeholder="+996 90 000 00 00"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-address-${student.id}`}>{t('address')} *</Label>
            <Input
              id={`edit-address-${student.id}`}
              placeholder="E.g. Bishkek, Chuy st. 12"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-parent-${student.id}`}>{t('parent_info_label')}</Label>
            <Input
              id={`edit-parent-${student.id}`}
              placeholder="E.g. Father: +996 90 000 00 00"
              value={formData.parent}
              onChange={(e) => setFormData((prev) => ({ ...prev, parent: e.target.value }))}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>{tCommon('status')}</Label>
            <Select
              value={formData.status}
              onValueChange={(val: StudentStatus | null) => val && setFormData((prev) => ({ ...prev, status: val }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('select_status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">{t('status_active')}</SelectItem>
                <SelectItem value="INACTIVE">{t('status_inactive')}</SelectItem>
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
                  {t('saving')}
                </>
              ) : (
                tSettings('save_changes')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
