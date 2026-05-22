'use client';

import Link from 'next/link';
import { ClipboardCheck } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export default function AttendancePage() {
  return (
    <div className="max-w-xl mx-auto mt-20 text-center space-y-4">
      <div className="inline-flex h-16 w-16 rounded-2xl bg-muted items-center justify-center">
        <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold">Посещаемость</h1>
      <p className="text-sm text-muted-foreground">
        Посещаемость пока доступна в разделе журнала. Отдельная страница
        посещаемости будет запущена позже.
      </p>
      <Link href="/journal" className={buttonVariants()}>
        Перейти в журнал
      </Link>
    </div>
  );
}
