'use client';

import { useState, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BookOpen, Loader2, Plus, UsersRound, Percent } from 'lucide-react';
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
import { enrollmentService, type CreateEnrollmentPayload } from '@/services/enrollments';
import { useGroups } from '@/hooks/useGroups';
import { useCourses } from '@/hooks/useCourses';
import { queryKeys } from '@/lib/api/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { getErrorMessage } from '@/lib/api/client';
import { useTranslations } from '@/i18n/index';

interface CreateStudentModalProps {
  open?: boolean;
  onClose?: () => void;
}

const emptyForm = {
  name: '',
  phone: '',
  address: '',
  parent: '',
  parent_phone: '',
  groupId: '',
  discount: '',
};

interface SavedStudent {
  id: string;
  temporaryPassword?: string;
  enrollment: CreateEnrollmentPayload;
}

export function CreateStudentModal({ open: externalOpen, onClose }: CreateStudentModalProps = {}) {
  const isControlled = externalOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled
    ? (val: boolean) => { if (!val) onClose?.(); }
    : setInternalOpen;
  const [isLoading, setIsLoading] = useState(false);
  const submittingRef = useRef(false);
  // Keep recovery and credentials in this mounted component only, never storage.
  const savedStudentRef = useRef<SavedStudent | null>(null);
  const [savedStudent, setSavedStudent] = useState<SavedStudent | null>(null);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const orgId = user?.organization_id;
  const t = useTranslations('students');
  const tCommon = useTranslations('common');

  const [formData, setFormData] = useState(emptyForm);
  const formLocked = isLoading || savedStudent !== null;

  const handleOpenChange = (nextOpen: boolean) => {
    // A pending request must settle before closing, including Escape/backdrop.
    if (!nextOpen && submittingRef.current) return;
    setOpen(nextOpen);
  };

  const { data: groupsData } = useGroups(open);
  const groups = useMemo(() => groupsData ?? [], [groupsData]);
  const { data: coursesData } = useCourses(open);
  const courses = useMemo(() => coursesData ?? [], [coursesData]);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === formData.groupId),
    [groups, formData.groupId],
  );
  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedGroup?.course_id),
    [courses, selectedGroup?.course_id],
  );
  const coursePrice = useMemo(
    () => Number(selectedCourse?.price ?? 0),
    [selectedCourse?.price],
  );
  const discountNumber = useMemo(() => {
    const n = Number(formData.discount);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [formData.discount]);
  const netPrice = Math.max(coursePrice - discountNumber, 0);
  const discountInvalid = discountNumber > coursePrice && coursePrice > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // React's disabled state cannot stop a second submit in the same turn.
    if (submittingRef.current) return;
    if (!savedStudentRef.current && (
      !formData.name.trim() || !formData.phone.trim() || !formData.address.trim() || !formData.groupId
    )) {
      toast.error(t('fill_required'));
      return;
    }
    if (!savedStudentRef.current && discountInvalid) {
      toast.error(t('discount_too_high'));
      return;
    }

    submittingRef.current = true;
    setIsLoading(true);
    setEnrollmentError(null);
    let saved = savedStudentRef.current;
    try {
      if (!saved) {
        const { groupId, discount, parent_phone, ...studentData } = formData;
        void discount;
        const res = await studentService.createStudent({
          ...studentData,
          parent_phone: parent_phone.trim() || undefined,
          status: 'ACTIVE',
        });

        saved = {
          id: res.student.id,
          temporaryPassword: res.temporaryPassword,
          enrollment: {
            student_id: res.student.id,
            group_id: groupId,
            ...(discountNumber > 0 ? { discount_amount: discountNumber } : {}),
          },
        };
        savedStudentRef.current = saved;
        setSavedStudent(saved);
        void queryClient.invalidateQueries({ queryKey: queryKeys.students.all(orgId) });

        if (saved.temporaryPassword) {
          toast.info(`${t('temp_password')}: ${saved.temporaryPassword}`, { duration: 10000 });
        }

        await enrollmentService.create(saved.enrollment);
      } else {
        // A lost response does not prove the write failed. Reconcile first;
        // if this read fails, keep recovery available without sending a POST.
        const enrollments = await enrollmentService.getByStudent(saved.id);
        const groupId = saved.enrollment.group_id;
        const alreadyEnrolled = enrollments.some((enrollment) => enrollment.group_id === groupId);
        if (!alreadyEnrolled) await enrollmentService.create(saved.enrollment);
      }

      void queryClient.invalidateQueries({ queryKey: queryKeys.students.all(orgId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all(orgId) });
      void queryClient.invalidateQueries({ queryKey: ['enrollments', 'group', saved.enrollment.group_id] });
      void queryClient.invalidateQueries({ queryKey: ['enrollments', 'student', saved.id] });
      toast.success(t('created_success'));
      savedStudentRef.current = null;
      setSavedStudent(null);
      setFormData(emptyForm);
      setOpen(false);
    } catch (error: unknown) {
      const message = getErrorMessage(error) || t(saved ? 'failed_enrollment' : 'failed_create');
      if (saved) setEnrollmentError(message);
      toast.error(saved ? `${t('enrollment_pending_title')}. ${message}` : message);
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger
          render={
            <Button>
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
        {savedStudent && (
          <div role="status" className="space-y-2 rounded-card border border-border bg-muted p-3 text-body-sm">
            <p className="font-medium">{t('enrollment_pending_title')}</p>
            <p>{t('enrollment_pending')}</p>
            {enrollmentError && <p className="text-destructive">{enrollmentError}</p>}
            {savedStudent.temporaryPassword && (
              <p>{t('temp_password')}: <code className="select-all">{savedStudent.temporaryPassword}</code></p>
            )}
            <p className="text-caption text-muted-foreground">{t('enrollment_resume_hint')}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">{t('full_name')} *</Label>
            <Input
              id="name"
              placeholder="Name and Surname"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              disabled={formLocked}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t('phone')} *</Label>
            <Input
              id="phone"
              placeholder="+996 90 000 00 00"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              disabled={formLocked}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">{t('address')} *</Label>
            <Input
              id="address"
              placeholder="Address"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              disabled={formLocked}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parent">{t('parent_info')}</Label>
            <Input
              id="parent"
              placeholder="E.g. Father: +996 90 000 00 00"
              value={formData.parent}
              onChange={(e) => setFormData((prev) => ({ ...prev, parent: e.target.value }))}
              disabled={formLocked}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parent_phone">{t('parent_phone')}</Label>
            <Input
              id="parent_phone"
              placeholder="+996 90 000 00 00"
              value={formData.parent_phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, parent_phone: e.target.value }))}
              disabled={formLocked}
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
              disabled={formLocked}
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
          {selectedGroup && (
            <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="discount" className="flex items-center gap-1.5">
                  <Percent className="size-3.5 text-muted-foreground" />
                  {t('discount')}
                </Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  placeholder="0"
                  value={formData.discount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, discount: e.target.value }))}
                  disabled={formLocked}
                  aria-invalid={discountInvalid}
                />
                <p className={`text-caption ${discountInvalid ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {discountInvalid ? t('discount_too_high') : t('discount_hint')}
                </p>
              </div>
              {coursePrice > 0 && (
                <div className="flex flex-col gap-1 text-caption">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>{t('course_price')}</span>
                    <span className="tabular-nums">{coursePrice.toLocaleString()} сом</span>
                  </div>
                  {discountNumber > 0 && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>{t('discount')}</span>
                      <span className="tabular-nums">- {discountNumber.toLocaleString()} сом</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between font-semibold text-foreground pt-1 border-t border-border">
                    <span>{t('net_price')}</span>
                    <span className="tabular-nums">{netPrice.toLocaleString()} сом</span>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
              className="w-full sm:w-auto rounded-xl"
            >
              {savedStudent ? t('close_for_now') : tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t(savedStudent ? 'enrolling' : 'creating')}
                </>
              ) : (
                t(savedStudent ? 'retry_enrollment' : 'create_student')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
