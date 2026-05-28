import { Skeleton } from '@/components/ui/skeleton';

export default function ScheduleLoading() {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-44 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Week day tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-[70px] rounded-xl" />
        ))}
      </div>

      {/* Time-slot grid */}
      <div className="grid grid-cols-1 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3 items-start">
            <Skeleton className="h-16 w-16 flex-shrink-0 rounded-xl" />
            <Skeleton
              className="h-16 flex-1 rounded-xl"
              style={{ opacity: 1 - i * 0.1 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
