import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page heading */}
      <Skeleton className="h-9 w-40 rounded-xl" />

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Settings nav */}
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" style={{ opacity: 1 - i * 0.1 }} />
          ))}
        </div>

        {/* Settings panel */}
        <div className="space-y-5">
          <Skeleton className="h-[160px] w-full rounded-2xl" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" style={{ opacity: 1 - i * 0.1 }} />
            ))}
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
