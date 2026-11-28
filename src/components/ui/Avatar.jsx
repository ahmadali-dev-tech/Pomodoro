import { cn } from '@/lib/utils'

export const initialsFor = (name) =>
  (name || '?').split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase() || '?'

export default function Avatar({ name, size = 32, className }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-raised font-semibold text-muted ring-1 ring-inset ring-line-strong', className)}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.38) }}
    >
      {initialsFor(name)}
    </span>
  )
}
