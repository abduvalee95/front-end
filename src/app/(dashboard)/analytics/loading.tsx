export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="h-10 w-full max-w-md bg-muted rounded animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-[140px] bg-muted rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 h-[400px] bg-muted rounded-2xl animate-pulse" />
        <div className="lg:col-span-2 h-[400px] bg-muted rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}
