'use client';

import { Calendar } from 'lucide-react';

export default function SchedulePage() {
  return (
    <div className="max-w-xl mx-auto mt-20 text-center space-y-4">
      <div className="inline-flex h-16 w-16 rounded-2xl bg-muted items-center justify-center">
        <Calendar className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold">Расписание занятий</h1>
      <p className="text-sm text-muted-foreground">
        Раздел находится в разработке. Скоро будет запущен.
      </p>
    </div>
  );
}
