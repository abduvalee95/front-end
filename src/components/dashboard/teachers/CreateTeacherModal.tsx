'use client';

import { useForm } from 'react-hook-form';
import { Loader2, GraduationCap, UserCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateTeacher } from '@/hooks/useTeachers';
import { useInviteUser } from '@/hooks/useUsers';
import type { CreateTeacherDto } from '@/types/teacher';

interface CreateTeacherModalProps {
  open: boolean;
  onClose: () => void;
}

type FormValues = {
  full_name: string;
  email: string;
  phone: string;
  password?: string;
  subjects: string;
  hourly_rate?: number;
  qualifications?: string;
};

export function CreateTeacherModal({ open, onClose }: CreateTeacherModalProps) {
  const createTeacherProfile = useCreateTeacher();
  const inviteUser = useInviteUser({ showToast: false });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      password: '',
      subjects: '',
      hourly_rate: undefined,
      qualifications: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    // Step 1: Invite/Create User first
    inviteUser.mutate({
      full_name: values.full_name,
      email: values.email,
      phone: values.phone,
      password: values.password,
      role: 'TEACHER'
    }, {
      onSuccess: (userData) => {
        // Step 2: Create Teacher Profile using the new user's ID
        createTeacherProfile.mutate({
          user_id: userData.user.id,
          full_name: values.full_name,
          email: values.email,
          phone: values.phone,
          subjects: values.subjects.split(',').map((s) => s.trim()).filter(Boolean),
          hourly_rate: values.hourly_rate ? Number(values.hourly_rate) : undefined,
          qualifications: values.qualifications,
        }, {
          onSuccess: () => {
            reset();
            onClose();
          }
        });
      }
    });
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="size-4 text-primary" />
            Add Teacher
          </DialogTitle>
          <DialogDescription>
            Create a new teacher profile in your organization.
          </DialogDescription>
        </DialogHeader>

        <form id="create-teacher-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* User Info */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <UserCircle2 className="size-3" /> Account Info
            </p>
            <Field label="Full Name *" error={errors.full_name?.message}>
              <Input {...register('full_name', { required: 'Required' })} placeholder="e.g. John Doe" />
            </Field>
            <Field label="Email *" error={errors.email?.message}>
              <Input type="email" {...register('email', { required: 'Required' })} placeholder="teacher@school.com" />
            </Field>
            <Field label="Phone *" error={errors.phone?.message}>
              <Input
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: { value: /^\+996\d{9}$/, message: 'Must be in format +996XXXXXXXXX' }
                })}
                placeholder="+996XXXXXXXXX"
              />
            </Field>
            <Field label="Password *" error={errors.password?.message}>
              <Input
                type="password"
                {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 chars' } })}
                placeholder="••••••••"
              />
            </Field>
          </div>

          <Separator />

          {/* Teacher Profile */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <GraduationCap className="size-3" /> Professional Info
            </p>
            <Field label="Subjects *" error={errors.subjects?.message}>
              <Input
                {...register('subjects', { required: 'Required' })}
                placeholder="e.g. Math, Physics (comma separated)"
              />
            </Field>
            <Field label="Hourly Rate" error={errors.hourly_rate?.message}>
              <Input
                type="number"
                {...register('hourly_rate')}
                placeholder="0.00"
                step="0.01"
              />
            </Field>
            <Field label="Qualifications" error={errors.qualifications?.message}>
              <Input {...register('qualifications')} placeholder="e.g. PhD in Mathematics" />
            </Field>
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={inviteUser.isPending || createTeacherProfile.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="create-teacher-form" className="edu-gradient-btn rounded-lg" disabled={inviteUser.isPending || createTeacherProfile.isPending}>
            {(inviteUser.isPending || createTeacherProfile.isPending) && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            Add Teacher
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
