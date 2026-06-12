'use client';

import { Badge } from '@/components/ui/badge';
import { useTranslations } from '@/i18n/index';
import { cn } from '@/lib/utils';
import type { OrganizationStatus } from '@/types/platform';

interface OrganizationStatusBadgeProps {
  status: OrganizationStatus;
}

export function OrganizationStatusBadge({ status }: OrganizationStatusBadgeProps) {
  const t = useTranslations('admin');
  const isActive = status === 'ACTIVE';
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 font-medium',
        isActive
          ? 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800'
          : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          isActive ? 'bg-teal-500' : 'bg-amber-500',
        )}
      />
      {isActive ? t('active') : t('inactive')}
    </Badge>
  );
}
