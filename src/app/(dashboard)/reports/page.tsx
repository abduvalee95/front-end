'use client';

import { BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="max-w-xl mx-auto mt-20 text-center space-y-4">
      <div className="inline-flex h-16 w-16 rounded-2xl bg-muted items-center justify-center">
        <BarChart3 className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold">Hisobotlar</h1>
      <p className="text-sm text-muted-foreground">
        Bu bo&apos;lim hozircha tayyorlanmoqda. Tez orada ishga tushiriladi.
      </p>
    </div>
  );
}
