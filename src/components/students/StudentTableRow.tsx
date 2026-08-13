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
      <TableCell className="pl-5 text-xs tabular-nums text-muted-foreground/50 w-8">{index}</TableCell>
      <TableCell className="py-3">
        <Link href={`/students/${student.id}`} className="flex items-center gap-3">
          <Avatar className="size-9 rounded-xl shrink-0">
            <AvatarFallback className={cn('rounded-xl text-sm font-semibold', avatarColor)}>
              {(student.name || '?').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary-emphasis dark:group-hover:text-primary-emphasis transition-colors">
              {student.name}
            </p>
            <p className="truncate text-caption tabular-nums text-muted-foreground">{student.phone}</p>
          </div>
        </Link>
      </TableCell>
      <TableCell>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-caption font-bold',
            student.status === 'ACTIVE'
              ? 'bg-success-muted text-success-emphasis dark:bg-success/10 dark:text-success-emphasis'
              : 'bg-muted text-muted-foreground dark:bg-card dark:text-muted-foreground',
          )}
        >
          <span className={cn('size-1.5 rounded-full', student.status === 'ACTIVE' ? 'bg-success' : 'bg-muted')} />
          {student.status === 'ACTIVE' ? t('status_active') : t('status_inactive')}
        </span>
      </TableCell>
      <TableCell>
        {student.paymentStatus === 'paid' && (
          <span
            role="img"
            aria-label={t('pay_paid')}
            className="inline-flex size-7 items-center justify-center rounded-full bg-success-muted text-success-emphasis dark:bg-success/20 dark:text-success-emphasis"
          >
            <Check aria-hidden="true" className="size-4 stroke-[3]" />
          </span>
        )}
        {student.paymentStatus === 'partial' && (
          <span
            role="img"
            aria-label={`${t('pay_partial')} ${student.paymentPercent ?? 0}%`}
            className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-warning-muted px-1.5 text-caption font-semibold tabular-nums text-warning-emphasis dark:bg-warning/20 dark:text-warning-emphasis"
          >
            {student.paymentPercent ?? 0}%
          </span>
        )}
        {student.paymentStatus === 'unpaid' && (
          <span
            role="img"
            aria-label={t('pay_unpaid')}
            className="inline-flex size-7 items-center justify-center rounded-full bg-danger-muted text-danger-emphasis dark:bg-danger/20 dark:text-danger-emphasis"
          >
            <X aria-hidden="true" className="size-4 stroke-[3]" />
          </span>
        )}
        {student.paymentStatus === 'unknown' && (
          <span aria-label="Unknown" className="text-muted-foreground/40 text-xs">—</span>
        )}
      </TableCell>
      <TableCell className="max-w-[200px] text-xs text-muted-foreground">
        <div>
          <p className="truncate font-medium text-foreground/80">
            {student.groups.join(', ') || <span className="text-border">—</span>}
          </p>
          <p className="truncate text-caption text-muted-foreground/70">{student.courses.join(', ') || t('no_course')}</p>
        </div>
      </TableCell>
      <TableCell className="text-xs tabular-nums text-muted-foreground max-w-[160px]">
        <span className="truncate block">{teacherScoped ? student.teachers.join(', ') || '—' : student.phone}</span>
      </TableCell>
      <TableCell>
        {student.totalDiscount > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-warning-muted px-2.5 py-0.5 text-caption font-bold text-warning-emphasis dark:bg-warning/10 dark:text-warning-emphasis">
            −{new Intl.NumberFormat('ru-RU').format(student.totalDiscount)} с
          </span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </TableCell>
      {canManageScope && (
        <TableCell className="pr-4 text-right">
          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <EditStudentModal
              student={student}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('edit_student')}
                  className="size-9 rounded-lg hover:bg-primary-muted hover:text-primary-emphasis dark:hover:bg-primary/10"
                >
                  <PenLine aria-hidden="true" className="size-3.5" />
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('delete_student')}
              className="size-9 rounded-lg hover:bg-danger-muted hover:text-danger-emphasis dark:hover:bg-danger/10 dark:hover:text-danger-emphasis"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? (
                <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
              ) : (
                <Trash2 aria-hidden="true" className="size-3.5" />
              )}
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}
