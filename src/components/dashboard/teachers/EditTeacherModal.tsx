'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, GraduationCap, UserCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
import type { TeacherProfile, UpdateTeacherDto, SalaryType } from '@/types/teacher';
import { TEACHER_SUBJECTS } from '@/types/teacher';
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
  const t = useTranslations('teachers');
  const tCommon = useTranslations('common');
  const tSettings = useTranslations('settings');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [salaryType, setSalaryType] = useState<SalaryType>('MONTHLY');

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
      setSalaryType(teacher.salary_type ?? 'MONTHLY');
    }
  }, [teacher, reset]);

  const handleAddSubject = (value: string | null) => {
    if (value && !selectedSubjects.includes(value)) {
      setSelectedSubjects((prev) => [...prev, value]);
    }
  };

  const handleRemoveSubject = (value: string) => {
    setSelectedSubjects((prev) => prev.filter((s) => s !== value));
  };

  const onSubmit = (values: FormValues) => {
    if (!teacher) return;
    const payload: UpdateTeacherDto = {
      full_name: values.full_name || undefined,
      phone: values.phone || undefined,
      subjects: selectedSubjects.length > 0 ? selectedSubjects : undefined,
      hourly_rate: values.hourly_rate ? Number(values.hourly_rate) : undefined,
      salary_type: salaryType,
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
                <Select onValueChange={handleAddSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('add_subject')} />
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
              <Field label={salaryType === 'MONTHLY' ? 'Oylik maosh (KGS)' : 'Kunlik stavka (KGS)'}>
                <Input type="number" step="100" {...register('hourly_rate')} placeholder={salaryType === 'MONTHLY' ? '15000' : '700'} />
              </Field>
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
