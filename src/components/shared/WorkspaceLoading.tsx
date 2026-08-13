import { Skeleton } from '@/components/ui/skeleton';

interface WorkspaceLoadingProps {
  hasHero?: boolean;
  rows?: number;
}

export function WorkspaceLoading({ hasHero = true, rows = 6 }: WorkspaceLoadingProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {hasHero && <Skeleton className="h-[180px] w-full rounded-card" />}

      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-64 rounded-xl" />
        <Skeleton className="h-9 w-48 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl ml-auto" />
      </div>

      <div className="space-y-2 rounded-2xl border border-border/60 p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-[60px] rounded-xl"
            style={{ opacity: 1 - i * 0.1 }}
          />
        ))}
      </div>
    </div>
  );
}
