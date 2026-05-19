'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, GraduationCap, UserCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
import { TEACHER_SUBJECTS, type SalaryType } from '@/types/teacher';
import { useTranslations } from '@/i18n/index';

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
  const t = useTranslations('teachers');
  const tCommon = useTranslations('common');
  const tAuth = useTranslations('auth');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectError, setSubjectError] = useState('');
  const [salaryType, setSalaryType] = useState<SalaryType>('MONTHLY');

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

  const handleAddSubject = (value: string | null) => {
    if (value && !selectedSubjects.includes(value)) {
      setSelectedSubjects((prev) => [...prev, value]);
      setSubjectError('');
    }
  };

  const handleRemoveSubject = (value: string) => {
    setSelectedSubjects((prev) => prev.filter((s) => s !== value));
  };

  const onSubmit = (values: FormValues) => {
    if (selectedSubjects.length === 0) {
      setSubjectError(t('subject_required'));
      return;
    }

    createTeacher.mutate({
      full_name: values.full_name,
      email: values.email,
      phone: values.phone,
      password: values.password,
      subjects: selectedSubjects,
      hourly_rate: values.hourly_rate ? Number(values.hourly_rate) : undefined,
      salary_type: salaryType,
      qualifications: values.qualifications || undefined,
    }, {
      onSuccess: () => {
        reset();
        setSelectedSubjects([]);
        setSalaryType('MONTHLY');
        onClose();
      },
    });
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      reset();
      setSelectedSubjects([]);
      setSubjectError('');
      setSalaryType('MONTHLY');
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
              <Select onValueChange={handleAddSubject}>
                <SelectTrigger>
                  <SelectValue placeholder={t('select_subjects')} />
                </SelectTrigger>
                <SelectContent>
                  {TEACHER_SUBJECTS.filter((s) => !selectedSubjects.includes(s)).map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSubjects.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedSubjects.map((subject) => (
                    <Badge key={subject} variant="secondary" className="gap-1 text-xs">
                      {subject.replace(/_/g, ' ')}
                      <button type="button" onClick={() => handleRemoveSubject(subject)} className="ml-0.5 hover:text-destructive">
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </Field>
            <div className="space-y-1.5">
              <Label className="text-xs">Oylik turi</Label>
              <div className="flex rounded-xl border border-border/60 bg-muted/40 p-0.5 w-fit">
                {(['MONTHLY', 'DAILY'] as SalaryType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSalaryType(type)}
                    className={`h-7 rounded-lg px-3 text-xs font-semibold transition-all ${
                      salaryType === type
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {type === 'MONTHLY' ? 'Oylik' : 'Kunlik'}
                  </button>
                ))}
              </div>
            </div>
            <Field label={salaryType === 'MONTHLY' ? 'Oylik maosh (KGS)' : 'Kunlik stavka (KGS)'} error={errors.hourly_rate?.message}>
              <Input
                type="number"
                {...register('hourly_rate')}
                placeholder={salaryType === 'MONTHLY' ? '15000' : '700'}
                step="100"
              />
            </Field>
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
