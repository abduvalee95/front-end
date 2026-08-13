'use client';

import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';
import { useTranslations } from '@/i18n';

export default function NotFound() {
  const t = useTranslations('notFound');
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl bg-muted">
          <FileQuestion className="size-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">{t('code')}</h1>
        <p className="text-base font-semibold text-foreground mb-1">{t('title')}</p>
        <p className="text-sm text-muted-foreground mb-6">{t('description')}</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
        >
          <Home className="size-4" />
          {t('back')}
        </Link>
      </div>
    </div>
  );
}
