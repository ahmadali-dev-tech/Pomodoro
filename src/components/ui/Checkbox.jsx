import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Native checkbox, visually replaced. Keeps keyboard and screen reader behaviour. */
export default function Checkbox({ checked, onChange, label, disabled, className }) {
  return (
    <label className={cn('relative inline-flex h-5 w-5 shrink-0 items-center justify-center', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer', className)}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={label}
        className="peer absolute inset-0 h-full w-full cursor-[inherit] opacity-0"
      />
      <span
        aria-hidden="true"
        className={cn(
          'flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent',
          checked ? 'border-accent bg-accent text-accent-fg' : 'border-line-strong bg-surface hover:border-muted',
        )}
      >
        {checked && <Check size={12} strokeWidth={3.5} />}
      </span>
    </label>
  )
}
