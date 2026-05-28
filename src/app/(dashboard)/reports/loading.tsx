import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsLoading() {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Page title + action */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-40 rounded-xl" />
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[120px] rounded-2xl" />
        ))}
      </div>

      {/* Chart area */}
      <Skeleton className="h-[280px] w-full rounded-2xl" />

      {/* Secondary grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Skeleton className="h-[240px] rounded-2xl" />
        <Skeleton className="h-[240px] rounded-2xl" />
      </div>
    </div>
  );
}
