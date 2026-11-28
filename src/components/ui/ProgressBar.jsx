import { cn } from '@/lib/utils'

export default function ProgressBar({ value, max = 100, color = 'var(--accent)', label, className, height = 6 }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      className={cn('w-full overflow-hidden rounded-full bg-raised', className)}
      style={{ height }}
    >
      <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}
