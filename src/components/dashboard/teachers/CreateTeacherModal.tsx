'use client';

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateTeacher } from '@/hooks/useTeachers';
import { useSubjects, useCreateSubject } from '@/hooks/useSubjects';
import { SubjectCombobox } from './SubjectCombobox';
import { type SalaryType } from '@/types/teacher';
import { useTranslations } from '@/i18n/index';
import type { Subject } from '@/types/subject';

interface CreateTeacherModalProps {
  open: boolean;
  onClose: () => void;
}

type FormValues = {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  hourly_rate?: number;
  qualifications?: string;
};

export function CreateTeacherModal({ open, onClose }: CreateTeacherModalProps) {
  const createTeacher = useCreateTeacher();
  const createSubject = useCreateSubject();
  const { data: orgSubjects = [] } = useSubjects();
  const t = useTranslations('teachers');
  const tCommon = useTranslations('common');
  const tAuth = useTranslations('auth');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectError, setSubjectError] = useState('');
  const [salaryType, setSalaryType] = useState<SalaryType>('FIXED');
  const [fixedSalary, setFixedSalary] = useState<number | undefined>(undefined);
  const [percentRate, setPercentRate] = useState<number | undefined>(undefined);

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
      hourly_rate: undefined,
      qualifications: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (selectedSubjects.length === 0) {
      setSubjectError(t('subject_required'));
      return;
    }

    // Auto-create subjects that don't exist in org yet
    const existingNames = new Set((orgSubjects as Subject[]).map((s) => s.name));
    const newSubjects = selectedSubjects.filter((name) => !existingNames.has(name));
    for (const name of newSubjects) {
      await createSubject.mutateAsync({ name });
    }

    createTeacher.mutate({
      full_name: values.full_name,
      email: values.email,
      phone: values.phone,
      password: values.password,
      subjects: selectedSubjects,
      hourly_rate: salaryType === 'HOURLY' ? (values.hourly_rate ? Number(values.hourly_rate) : undefined) : undefined,
      salary_type: salaryType,
      fixed_salary: salaryType === 'FIXED' ? fixedSalary : undefined,
      percent_rate: salaryType === 'GROUP_PERCENT' ? percentRate : undefined,
      qualifications: values.qualifications || undefined,
    }, {
      onSuccess: () => {
        reset();
        setSelectedSubjects([]);
        setSalaryType('FIXED');
        setFixedSalary(undefined);
        setPercentRate(undefined);
        onClose();
      },
    });
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      reset();
      setSelectedSubjects([]);
      setSubjectError('');
      setSalaryType('FIXED');
      setFixedSalary(undefined);
      setPercentRate(undefined);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <DialogTitle>{t('add_teacher')}</DialogTitle>
              <DialogDescription>{t('add_teacher_desc')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form id="create-teacher-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* User Info */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <UserCircle2 className="size-3" /> {t('account_info')}
            </p>
            <Field label={`${t('full_name')} *`} error={errors.full_name?.message}>
              <Input {...register('full_name', { required: tCommon('required') })} placeholder="e.g. John Doe" />
            </Field>
            <Field label={`${tCommon('email')} *`} error={errors.email?.message}>
              <Input type="email" {...register('email', { required: tCommon('required') })} placeholder="teacher@school.com" />
            </Field>
            <Field label={`${t('phone')} *`} error={errors.phone?.message}>
              <Input
                {...register('phone', {
                  required: t('phone_required'),
                  pattern: { value: /^\+996\d{9}$/, message: t('phone_format') }
                })}
                placeholder="+996XXXXXXXXX"
              />
            </Field>
            <Field label={`${tAuth('password')} *`} error={errors.password?.message}>
              <Input
                type="password"
                {...register('password', { required: tCommon('required'), minLength: { value: 6, message: tCommon('min_6_chars') } })}
                placeholder="••••••••"
              />
            </Field>
          </div>

          <Separator />

          {/* Teacher Profile */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <GraduationCap className="size-3" /> {t('professional_info')}
            </p>
            <Field label={`${tCommon('subjects')} *`} error={subjectError}>
              <SubjectCombobox value={selectedSubjects} onChange={setSelectedSubjects} />
            </Field>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('salary_type_label')}</Label>
              <Select value={salaryType} onValueChange={(v) => setSalaryType(v as SalaryType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXED">{t('salary_fixed')}</SelectItem>
                  <SelectItem value="HOURLY">{t('salary_hourly')}</SelectItem>
                  <SelectItem value="GROUP_PERCENT">{t('salary_group_percent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {salaryType === 'FIXED' && (
              <Field label={t('fixed_salary_label')} error={undefined}>
                <Input
                  type="number"
                  value={fixedSalary ?? ''}
                  onChange={(e) => setFixedSalary(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="300"
                />
              </Field>
            )}
            {salaryType === 'HOURLY' && (
              <Field label={t('hourly_rate_label')} error={errors.hourly_rate?.message}>
                <Input
                  type="number"
                  {...register('hourly_rate')}
                  placeholder="500"
                  step="1"
                />
              </Field>
            )}
            {salaryType === 'GROUP_PERCENT' && (
              <Field label={t('percent_rate_label')} error={undefined}>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={percentRate ?? ''}
                  onChange={(e) => setPercentRate(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="30"
                />
              </Field>
            )}
            <Field label={t('qualifications')} error={errors.qualifications?.message}>
              <Input {...register('qualifications')} placeholder="e.g. PhD in Mathematics" />
            </Field>
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={createTeacher.isPending} className="rounded-xl">
            {tCommon('cancel')}
          </Button>
          <Button type="submit" form="create-teacher-form" className="edu-gradient-btn rounded-xl" disabled={createTeacher.isPending}>
            {createTeacher.isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            {t('add_teacher')}
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
