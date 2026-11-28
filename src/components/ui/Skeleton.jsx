import { cn } from '@/lib/utils'

export function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />
}

/** Placeholder list rows shown while cloud data is loading. */
export function SkeletonRows({ count = 4 }) {
  return (
    <div className="divide-line" role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5">
          <Skeleton className="h-[18px] w-[18px] rounded-[5px]" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}
