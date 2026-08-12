'use client';

import { AlertCircle, BookOpen, RefreshCw, ShieldAlert, UsersRound, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/i18n/index';

export function TeacherPrompt() {
  const t = useTranslations('students');
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary-muted dark:bg-primary/10">
        <BookOpen className="size-6 text-primary-emphasis" />
      </div>
      <p className="text-sm font-bold text-foreground">{t('select_teacher')}</p>
      <p className="mt-1.5 max-w-xs text-xs text-muted-foreground">{t('select_teacher_desc')}</p>
    </div>
  );
}

export function EmptyState({
  hasFilters,
  teacherScoped,
  onClear,
}: {
  hasFilters: boolean;
  teacherScoped: boolean;
  onClear: () => void;
}) {
  const t = useTranslations('students');
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted">
        <UsersRound className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-bold">{hasFilters ? t('no_matching_students') : t('no_students_yet')}</p>
      <p className="mt-1.5 max-w-xs text-xs text-muted-foreground">
        {teacherScoped ? t('enroll_first') : t('add_first')}
      </p>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onClear} className="mt-4 rounded-xl text-xs h-8">
          <X className="mr-1.5 size-3" /> Clear filters
        </Button>
      )}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-danger-muted dark:bg-danger/10">
        <AlertCircle className="size-6 text-danger-emphasis" />
      </div>
      <p className="text-sm font-bold">Failed to load students</p>
      <p className="mt-1.5 text-xs text-muted-foreground">Check backend connection and try again.</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 rounded-xl text-xs h-8">
        <RefreshCw className="mr-1.5 size-3" /> Retry
      </Button>
    </div>
  );
}

export function AccessDenied({ role }: { role?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-muted">
          <ShieldAlert className="size-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-black">Access Denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your role{role ? ` (${role})` : ''} cannot access the student roster.
        </p>
      </div>
    </div>
  );
}
