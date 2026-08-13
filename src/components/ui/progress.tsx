'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    
    return (
      <div
        ref={ref}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-muted',
          className
        )}
        {...props}
      >
        <div
          className="h-full transition-all duration-300 ease-in-out rounded-full bg-primary"
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }
)
Progress.displayName = 'Progress'

export { Progress }
