import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const VARIANTS = {
  primary: 'bg-accent text-accent-fg hover:brightness-110 active:brightness-95',
  secondary: 'border border-line-strong bg-surface text-text hover:bg-raised',
  ghost: 'text-muted hover:bg-raised hover:text-text',
  danger: 'bg-danger text-danger-fg hover:brightness-110 active:brightness-95',
  'danger-quiet': 'text-danger hover:bg-danger-soft',
}
const SIZES = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
  lg: 'h-11 px-5 text-[15px] gap-2',
  icon: 'h-8 w-8 justify-center',
  'icon-lg': 'h-10 w-10 justify-center',
}

/** Shared button. `loading` disables the button, shows a spinner, and sets aria-busy. */
const Button = forwardRef(function Button(
  { variant = 'secondary', size = 'md', loading = false, disabled, className, children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-md font-medium transition-[background-color,filter,color] duration-100 disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant], SIZES[size], className,
      )}
      {...props}
    >
      {loading && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
})
export default Button
