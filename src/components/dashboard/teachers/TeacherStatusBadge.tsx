'use client';

import { Badge } from '@/components/ui/badge';
import { useTranslations } from '@/i18n/index';
import { TeacherStatus } from '@/types/teacher';
import { CheckCircle2, XCircle, Clock, Trash2 } from 'lucide-react';

interface TeacherStatusBadgeProps {
  status: TeacherStatus;
}

export function TeacherStatusBadge({ status }: TeacherStatusBadgeProps) {
  const t = useTranslations('teachers');
  switch (status) {
    case 'ACTIVE':
      return (
        <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200/50 gap-1.5 px-2 py-0.5">
          <CheckCircle2 className="size-3" />
          {t('status_active')}
        </Badge>
      );
    case 'INACTIVE':
      return (
        <Badge variant="destructive" className="bg-amber-50 text-amber-700 border-amber-200/50 gap-1.5 px-2 py-0.5">
          <XCircle className="size-3" />
          {t('status_inactive')}
        </Badge>
      );
    case 'ON_LEAVE':
      return (
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200/50 gap-1.5 px-2 py-0.5">
          <Clock className="size-3" />
          {t('status_on_leave')}
        </Badge>
      );
    case 'DELETED':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200/50 gap-1.5 px-2 py-0.5">
          <Trash2 className="size-3" />
          {t('status_deleted')}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1.5 px-2 py-0.5">
          {status}
        </Badge>
      );
  }
}
