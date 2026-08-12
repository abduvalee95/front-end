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
          ? 'bg-success-muted text-success-emphasis border-success/30 dark:bg-success-muted dark:text-success-emphasis dark:border-success/30'
          : 'bg-warning-muted text-warning-emphasis border-warning/30 dark:bg-warning-muted dark:text-warning-emphasis dark:border-warning/30',
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          isActive ? 'bg-success' : 'bg-warning',
        )}
      />
      {isActive ? t('active') : t('inactive')}
    </Badge>
  );
}
