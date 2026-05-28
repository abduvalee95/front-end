import { Skeleton } from '@/components/ui/skeleton';

export default function AttendanceLoading() {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-48 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 w-40 rounded-xl" />
        <Skeleton className="h-9 w-40 rounded-xl" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>

      {/* Table */}
      <div className="space-y-2 rounded-2xl border border-border/60 p-4">
        <Skeleton className="h-11 w-full rounded-xl" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-[56px] rounded-xl"
            style={{ opacity: 1 - i * 0.09 }}
          />
        ))}
      </div>
    </div>
  );
}
