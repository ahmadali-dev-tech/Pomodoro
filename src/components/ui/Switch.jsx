import { cn } from '@/lib/utils'

export default function Switch({ checked, onChange, label, disabled, id }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-[22px] w-10 shrink-0 rounded-full border transition-colors disabled:opacity-50',
        checked ? 'border-accent bg-accent' : 'border-line-strong bg-raised',
      )}
    >
      <span
        className={cn(
          'absolute top-[2px] h-4 w-4 rounded-full transition-[left,background-color]',
          checked ? 'left-[20px] bg-accent-fg' : 'left-[2px] bg-muted',
        )}
      />
    </button>
  )
}
