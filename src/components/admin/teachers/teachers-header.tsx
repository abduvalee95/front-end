'use client'

export function TeachersHeader() {
  return (
    <div className="edu-gradient-header rounded-xl p-6 mb-6 border border-border/50">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teachers</h1>
          <p className="text-muted-foreground mt-1">
            View all teachers across organizations
          </p>
        </div>
      </div>
    </div>
  )
}
