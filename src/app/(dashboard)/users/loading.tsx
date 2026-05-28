import { Skeleton } from '@/components/ui/skeleton';

export default function UsersLoading() {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-36 rounded-xl" />
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 w-64 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
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
