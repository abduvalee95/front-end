'use client';

import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import {
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Award,
  BookOpen,
  Pencil,
  Power,
  Trash2,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TeacherStatusBadge } from './TeacherStatusBadge';
import { journalService } from '@/services/journal';
import type { TeacherProfile } from '@/types/teacher';

function formatKGS(amount: number) {
  return new Intl.NumberFormat('ky-KG').format(amount) + ' KGS';
}

interface TeacherDetailSheetProps {
  teacher: TeacherProfile | null;
  onClose: () => void;
  onEdit: (teacher: TeacherProfile) => void;
  onToggleStatus: (teacher: TeacherProfile) => void;
  onDelete: (teacher: TeacherProfile) => void;
}

export function TeacherDetailSheet({
  teacher,
  onClose,
  onEdit,
  onToggleStatus,
  onDelete,
}: TeacherDetailSheetProps) {
  if (!teacher) return null;

  const isActive = teacher.status === 'ACTIVE';

  const now = new Date();
  const monthFrom = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthTo = format(endOfMonth(now), 'yyyy-MM-dd');

  const journalQuery = useQuery({
    queryKey: ['journal', 'teacher', teacher.id, monthFrom],
    queryFn: () => journalService.findByTeacher(teacher.id, { date_from: monthFrom, date_to: monthTo, limit: 500 }),
    enabled: !!teacher.id && teacher.salary_type === 'DAILY',
  });

  const workedDays = useMemo(() => {
    const entries = journalQuery.data?.items ?? [];
    const uniqueDates = new Set(entries.map((e) => e.date?.slice(0, 10)));
    return uniqueDates.size;
  }, [journalQuery.data]);

  const calculatedSalary = useMemo(() => {
    if (!teacher.hourly_rate) return null;
    if (teacher.salary_type === 'MONTHLY') return teacher.hourly_rate;
    return teacher.hourly_rate * workedDays;
  }, [teacher.hourly_rate, teacher.salary_type, workedDays]);

  return (
    <Sheet open={!!teacher} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="size-12 shrink-0">
              <AvatarFallback className="text-lg font-semibold edu-gradient-avatar">
                {teacher.full_name?.charAt(0).toUpperCase() || 'T'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate">{teacher.full_name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1">
                <TeacherStatusBadge status={teacher.status} />
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Contact Info */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Contact Information
            </p>
            <InfoRow icon={<Mail className="size-4" />} label="Email" value={teacher.email} />
            <InfoRow icon={<Phone className="size-4" />} label="Phone" value={teacher.phone || '—'} />
            <InfoRow
              icon={<Calendar className="size-4" />}
              label="Joined"
              value={format(new Date(teacher.created_at), 'MMMM d, yyyy')}
            />
          </div>

          <Separator />

          {/* Professional Info */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Professional Details
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <BookOpen className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Subjects</p>
                  {teacher.subjects?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {teacher.subjects.map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">
                          {s.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm">—</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">
                  {teacher.salary_type === 'DAILY' ? 'Kunlik stavka' : 'Oylik maosh'}
                </p>
                <p className="text-sm font-medium">
                  {teacher.hourly_rate ? formatKGS(teacher.hourly_rate) : '—'}
                </p>
                {teacher.salary_type === 'DAILY' && teacher.hourly_rate && (
                  <div className="mt-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1.5">
                    <p className="text-[11px] text-muted-foreground">
                      {format(now, 'MMMM yyyy')} — ishlagan kunlar:{' '}
                      <span className="font-bold text-foreground">{workedDays}</span>
                    </p>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                      Hisoblangan: {formatKGS(calculatedSalary ?? 0)}
                    </p>
                  </div>
                )}
                {teacher.salary_type === 'MONTHLY' && teacher.hourly_rate && (
                  <div className="mt-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1.5">
                    <p className="text-[11px] text-muted-foreground">{format(now, 'MMMM yyyy')} — oylik</p>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                      {formatKGS(teacher.hourly_rate)}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <InfoRow
              icon={<Award className="size-4" />}
              label="Qualifications"
              value={teacher.qualifications || '—'}
            />
            {teacher.bio && (
              <div className="flex items-start gap-3">
                <GraduationCap className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Bio</p>
                  <p className="text-sm mt-0.5">{teacher.bio}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => { onClose(); onEdit(teacher); }}
          >
            <Pencil className="mr-2 size-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`flex-1 ${isActive ? 'text-amber-600 border-amber-200 hover:bg-amber-50' : 'text-teal-600 border-teal-200 hover:bg-teal-50'}`}
            onClick={() => { onClose(); onToggleStatus(teacher); }}
          >
            <Power className="mr-2 size-3.5" />
            {isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => { onClose(); onDelete(teacher); }}
          >
            <Trash2 className="mr-2 size-3.5" />
            Delete
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm truncate">{value}</p>
      </div>
    </div>
  );
}
