import { Skeleton } from '@/components/ui/skeleton';

export default function FinanceLoading() {
  return (
    <div className="flex flex-col gap-5 p-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-32 rounded-xl" />
          <Skeleton className="h-8 w-32 rounded-xl" />
        </div>
      </div>
      <Skeleton className="h-12 w-64 rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[140px] rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-16 rounded-2xl" />
      <div className="space-y-2 rounded-2xl border border-border/50 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[50px] rounded-xl" style={{ opacity: 1 - i * 0.1 }} />
        ))}
      </div>
    </div>
  );
}
