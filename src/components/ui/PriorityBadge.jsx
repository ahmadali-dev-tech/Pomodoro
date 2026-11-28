import { PRIORITY_LEVEL } from '@/constants'
import { cn } from '@/lib/utils'

const TONE = { low: 'var(--muted)', medium: 'var(--muted)', high: 'var(--warning)', urgent: 'var(--danger)' }
const HEIGHTS = [5, 8, 11, 14]

/** Priority as a four-step level marker. The level is also written out for screen readers (and on request). */
export default function PriorityBadge({ priority = 'medium', showLabel = false, className }) {
  const level = PRIORITY_LEVEL[priority] || 2
  const label = priority.charAt(0).toUpperCase() + priority.slice(1)
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs text-muted', className)} title={`${label} priority`}>
      <span className="flex h-[14px] items-end gap-[2px]" aria-hidden="true">
        {HEIGHTS.map((h, i) => (
          <span
            key={h}
            className="w-[3px] rounded-[1px]"
            style={{ height: h, background: i < level ? TONE[priority] : 'var(--line-strong)' }}
          />
        ))}
      </span>
      {showLabel ? <span>{label}</span> : <span className="sr-only">{label} priority</span>}
    </span>
  )
}
