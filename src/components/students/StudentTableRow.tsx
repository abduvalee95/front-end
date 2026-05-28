'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, PenLine, Trash2, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { useTranslations } from '@/i18n/index';
import { cn } from '@/lib/utils';
import { studentService } from '@/services/students';
import { queryKeys } from '@/lib/api/query-keys';
import { EditStudentModal } from './EditStudentModal';
import { getAvatarColor, type StudentRow } from './types';

interface StudentTableRowProps {
  student: StudentRow;
  index: number;
  teacherScoped: boolean;
  canManageScope: boolean;
  orgId?: string;
}

export function StudentTableRow({ student, index, teacherScoped, canManageScope, orgId }: StudentTableRowProps) {
  const t = useTranslations('students');
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(t('delete_confirm').replace('{name}', student.name))) return;
    try {
      setIsDeleting(true);
      await studentService.deleteStudent(student.id);
      toast.success(t('deleted_success'));
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all(orgId) });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('delete_failed');
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const avatarColor = getAvatarColor(student.name);

  return (
    <TableRow className="group border-b border-border/40 transition-colors hover:bg-muted/30">
      <TableCell className="pl-5 text-xs font-mono text-muted-foreground/50 w-8">{index}</TableCell>
      <TableCell className="py-3">
        <Link href={`/students/${student.id}`} className="flex items-center gap-3">
          <Avatar className="size-9 rounded-xl shrink-0">
            <AvatarFallback className={cn('rounded-xl text-sm font-black', avatarColor)}>
              {(student.name || '?').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {student.name}
            </p>
            <p className="truncate text-[11px] font-mono text-muted-foreground">{student.phone}</p>
          </div>
        </Link>
      </TableCell>
      <TableCell>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold',
            student.status === 'ACTIVE'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
          )}
        >
          <span className={cn('size-1.5 rounded-full', student.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400')} />
          {student.status === 'ACTIVE' ? t('status_active') : t('status_inactive')}
        </span>
      </TableCell>
      <TableCell>
        {student.paymentStatus === 'paid' && (
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
            <Check className="size-4 stroke-[3]" />
          </span>
        )}
        {student.paymentStatus === 'partial' && (
          <span className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-amber-100 px-1.5 text-[11px] font-black tabular-nums text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
            {student.paymentPercent ?? 0}%
          </span>
        )}
        {student.paymentStatus === 'unpaid' && (
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
            <X className="size-4 stroke-[3]" />
          </span>
        )}
        {student.paymentStatus === 'unknown' && (
          <span className="text-muted-foreground/40 text-xs">—</span>
        )}
      </TableCell>
      <TableCell className="max-w-[200px] text-xs text-muted-foreground">
        <div>
          <p className="truncate font-medium text-foreground/80">
            {student.groups.join(', ') || <span className="text-border">—</span>}
          </p>
          <p className="truncate text-[11px] text-muted-foreground/70">{student.courses.join(', ') || t('no_course')}</p>
        </div>
      </TableCell>
      <TableCell className="text-xs font-mono text-muted-foreground max-w-[160px]">
        <span className="truncate block">{teacherScoped ? student.teachers.join(', ') || '—' : student.phone}</span>
      </TableCell>
      <TableCell>
        {student.totalDiscount > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            −{new Intl.NumberFormat('ru-RU').format(student.totalDiscount)} с
          </span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </TableCell>
      {canManageScope && (
        <TableCell className="pr-4 text-right">
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <EditStudentModal
              student={student}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10"
                >
                  <PenLine className="size-3.5" />
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}
