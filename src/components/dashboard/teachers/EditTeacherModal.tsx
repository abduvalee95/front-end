'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUpdateTeacher } from '@/hooks/useTeachers';
import { useSubjects, useCreateSubject } from '@/hooks/useSubjects';
import { SubjectCombobox } from './SubjectCombobox';
import type { TeacherProfile, UpdateTeacherDto, SalaryType } from '@/types/teacher';
import type { Subject } from '@/types/subject';
import { useTranslations } from '@/i18n/index';

interface EditTeacherModalProps {
  teacher: TeacherProfile | null;
  onClose: () => void;
}

type FormValues = {
  full_name: string;
  phone: string;
  hourly_rate?: number;
  qualifications?: string;
  bio?: string;
};

export function EditTeacherModal({ teacher, onClose }: EditTeacherModalProps) {
  const updateTeacher = useUpdateTeacher();
  const createSubject = useCreateSubject();
  const { data: orgSubjects = [] } = useSubjects();
  const t = useTranslations('teachers');
  const tCommon = useTranslations('common');
  const tSettings = useTranslations('settings');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [salaryType, setSalaryType] = useState<SalaryType>('FIXED');
  const [fixedSalary, setFixedSalary] = useState<number | undefined>(undefined);
  const [percentRate, setPercentRate] = useState<number | undefined>(undefined);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>();

  useEffect(() => {
    if (teacher) {
      reset({
        full_name: teacher.full_name || '',
        phone: teacher.phone || '',
        hourly_rate: teacher.hourly_rate ?? undefined,
        qualifications: teacher.qualifications || '',
        bio: teacher.bio || '',
      });
      setSelectedSubjects(teacher.subjects ?? []);
      setSalaryType(teacher.salary_type ?? 'FIXED');
      setFixedSalary(teacher.fixed_salary ?? undefined);
      setPercentRate(teacher.percent_rate ?? undefined);
    }
  }, [teacher, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!teacher) return;

    // Auto-create subjects that don't exist in org yet
    const existingNames = new Set((orgSubjects as Subject[]).map((s) => s.name));
    const newSubjects = selectedSubjects.filter((name) => !existingNames.has(name));
    for (const name of newSubjects) {
      await createSubject.mutateAsync({ name });
    }

    const payload: UpdateTeacherDto = {
      full_name: values.full_name || undefined,
      phone: values.phone || undefined,
      subjects: selectedSubjects.length > 0 ? selectedSubjects : undefined,
      hourly_rate: salaryType === 'HOURLY' ? (values.hourly_rate ? Number(values.hourly_rate) : undefined) : undefined,
      salary_type: salaryType,
      fixed_salary: salaryType === 'FIXED' ? fixedSalary : undefined,
      percent_rate: salaryType === 'GROUP_PERCENT' ? percentRate : undefined,
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
                  {teacher.full_name?.charAt(0).toUpperCase() || 'T'}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="min-w-0">
              <SheetTitle className="truncate">{teacher?.full_name ?? t('edit_teacher')}</SheetTitle>
              <SheetDescription>{t('edit_teacher_desc')}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="edit-teacher-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <UserCircle2 className="size-3" /> {tCommon('basic_info')}
              </p>
              <Field label={`${t('full_name')} *`} error={errors.full_name?.message}>
                <Input {...register('full_name', { required: tCommon('required') })} />
              </Field>
              <Field label={t('phone')}>
                <Input {...register('phone')} placeholder="+996XXXXXXXXX" />
              </Field>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <GraduationCap className="size-3" /> {t('professional')}
              </p>
              <Field label={tCommon('subjects')}>
                <SubjectCombobox value={selectedSubjects} onChange={setSelectedSubjects} />
              </Field>
              <div className="space-y-1.5">
                <Label className="text-xs">Maosh turi</Label>
                <Select value={salaryType} onValueChange={(v) => setSalaryType(v as SalaryType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Belgilangan (Фикс)</SelectItem>
                    <SelectItem value="HOURLY">Soatbay (Часовой)</SelectItem>
                    <SelectItem value="GROUP_PERCENT">Guruhdan foiz (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {salaryType === 'FIXED' && (
                <Field label="Belgilangan oylik maosh (сом)">
                  <Input
                    type="number"
                    value={fixedSalary ?? ''}
                    onChange={(e) => setFixedSalary(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="3000000"
                  />
                </Field>
              )}
              {salaryType === 'HOURLY' && (
                <Field label="Soat narxi (сом)">
                  <Input type="number" step="1000" {...register('hourly_rate')} placeholder="50000" />
                </Field>
              )}
              {salaryType === 'GROUP_PERCENT' && (
                <Field label="Foiz (%)">
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
              <Field label={t('qualifications')}>
                <Input {...register('qualifications')} placeholder="PhD in Math" />
              </Field>
            </div>
          </form>
        </div>

        <SheetFooter className="px-6 py-4 border-t flex flex-row gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose} disabled={updateTeacher.isPending}>
            {tCommon('cancel')}
          </Button>
          <Button type="submit" form="edit-teacher-form" className="edu-gradient-btn rounded-lg" disabled={updateTeacher.isPending}>
            {updateTeacher.isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            {tSettings('save_changes')}
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
