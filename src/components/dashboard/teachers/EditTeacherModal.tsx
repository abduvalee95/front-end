'use client';

import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { Loader2, GraduationCap, UserCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUpdateTeacher } from '@/hooks/useTeachers';
import type { TeacherProfile, UpdateTeacherDto } from '@/types/teacher';

interface EditTeacherModalProps {
  teacher: TeacherProfile | null;
  onClose: () => void;
}

type FormValues = {
  full_name: string;
  email: string;
  phone: string;
  subjects: string;
  hourly_rate?: number;
  qualifications?: string;
  bio?: string;
};

export function EditTeacherModal({ teacher, onClose }: EditTeacherModalProps) {
  const updateTeacher = useUpdateTeacher();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>();

  useEffect(() => {
    if (teacher) {
      reset({
        full_name: teacher.user?.full_name || '',
        email: teacher.user?.email || '',
        phone: teacher.user?.phone || '',
        subjects: teacher.subjects?.join(', ') || '',
        hourly_rate: teacher.hourly_rate || undefined,
        qualifications: teacher.qualifications || '',
        bio: teacher.bio || '',
      });
    }
  }, [teacher, reset]);

  const onSubmit = (values: FormValues) => {
    if (!teacher) return;
    const payload: UpdateTeacherDto = {
      full_name: values.full_name || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      subjects: values.subjects ? values.subjects.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      hourly_rate: values.hourly_rate ? Number(values.hourly_rate) : undefined,
      qualifications: values.qualifications || undefined,
      bio: values.bio || undefined,
    };
    updateTeacher.mutate({ id: teacher.id, data: payload }, { onSuccess: onClose });
  };

  return (
    <Sheet open={!!teacher} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b">
          <div className="flex items-center gap-3">
            {teacher && (
              <Avatar className="size-9 shrink-0">
                <AvatarFallback className="edu-gradient-avatar font-semibold">
                  {teacher.user?.full_name?.charAt(0).toUpperCase() || 'T'}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="min-w-0">
              <SheetTitle className="truncate">{teacher?.user?.full_name ?? 'Edit Teacher'}</SheetTitle>
              <SheetDescription>Update teacher profile details</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="edit-teacher-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <UserCircle2 className="size-3" /> Basic Info
              </p>
              <Field label="Full Name *" error={errors.full_name?.message}>
                <Input {...register('full_name', { required: 'Required' })} />
              </Field>
              <Field label="Email *" error={errors.email?.message}>
                <Input type="email" {...register('email', { required: 'Required' })} />
              </Field>
              <Field label="Phone">
                <Input {...register('phone')} placeholder="+996XXXXXXXXX" />
              </Field>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <GraduationCap className="size-3" /> Professional
              </p>
              <Field label="Subjects" error={errors.subjects?.message}>
                <Input {...register('subjects')} placeholder="Math, Physics" />
              </Field>
              <Field label="Hourly Rate">
                <Input type="number" step="0.01" {...register('hourly_rate')} placeholder="0.00" />
              </Field>
              <Field label="Qualifications">
                <Input {...register('qualifications')} placeholder="PhD in Math" />
              </Field>
            </div>
          </form>
        </div>

        <SheetFooter className="px-6 py-4 border-t flex flex-row gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose} disabled={updateTeacher.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="edit-teacher-form" className="edu-gradient-btn rounded-lg" disabled={updateTeacher.isPending}>
            {updateTeacher.isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
