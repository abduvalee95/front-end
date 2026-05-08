'use client';

import { useDateRange } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

const PRESETS: { key: '7d' | '30d' | '90d' | 'mtd'; label: string }[] = [
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
  { key: 'mtd', label: 'MTD' },
];

export function DateRangeFilter() {
  const { preset, setPreset, range } = useDateRange();
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="inline-flex items-center rounded-lg bg-muted p-1">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-md transition-colors',
              preset === p.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="h-3.5 w-3.5" />
        <span>
          {range.from ? format(range.from, 'MMM d') : '—'} &rarr;{' '}
          {range.to ? format(range.to, 'MMM d, yyyy') : '—'}
        </span>
      </div>
    </div>
  );
}
