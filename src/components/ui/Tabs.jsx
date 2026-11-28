import { cn } from '@/lib/utils'

/** Underlined filter tabs with optional counts. Buttons use aria-pressed (they filter one list, not swap panels). */
export function FilterTabs({ value, onChange, options, label, className }) {
  return (
    <div role="group" aria-label={label} className={cn('scroll-quiet -mb-px flex gap-5 overflow-x-auto border-b border-line', className)}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative shrink-0 whitespace-nowrap pb-2.5 pt-1 text-[13px] font-medium transition-colors',
              active ? 'text-text' : 'text-muted hover:text-text',
            )}
          >
            {option.label}
            {typeof option.count === 'number' && (
              <span className={cn('tnum ml-1.5 text-xs font-normal', active ? 'text-muted' : 'text-faint')}>{option.count}</span>
            )}
            {active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />}
          </button>
        )
      })}
    </div>
  )
}

/** Compact segmented control for switching a view or mode. */
export function Segmented({ value, onChange, options, label, className, size = 'md' }) {
  return (
    <div role="group" aria-label={label} className={cn('inline-flex rounded-md border border-line bg-raised p-0.5', className)}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-[5px] font-medium transition-colors',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-[13px]',
              active ? 'border border-line bg-surface text-text' : 'border border-transparent text-muted hover:text-text',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
