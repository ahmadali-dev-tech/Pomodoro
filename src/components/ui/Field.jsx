import { Children, cloneElement, forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn('field', className)} {...props} />
})
export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn('field', className)} {...props} />
})
export const Select = forwardRef(function Select({ className, ...props }, ref) {
  return <select ref={ref} className={cn('field', className)} {...props} />
})

/**
 * Label + control + hint/error, wired together for assistive tech.
 * Pass a single control as the child. Use `group` for controls that are not one input.
 */
export function Field({ label, hint, error, optional, group, className, children }) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint && !error && hintId, error && errorId].filter(Boolean).join(' ') || undefined
  const labelClass = 'mb-1.5 block text-[13px] font-medium text-text'
  const suffix = optional && <span className="ml-1.5 font-normal text-faint">optional</span>

  return (
    <div className={className} role={group ? 'group' : undefined} aria-labelledby={group ? `${id}-label` : undefined}>
      {group
        ? <span id={`${id}-label`} className={labelClass}>{label}{suffix}</span>
        : <label htmlFor={id} className={labelClass}>{label}{suffix}</label>}
      {group
        ? children
        : cloneElement(Children.only(children), {
            id,
            'aria-invalid': error ? 'true' : undefined,
            'aria-describedby': describedBy,
          })}
      {hint && !error && <p id={hintId} className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && <p id={errorId} role="alert" className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  )
}
