import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'
const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

/**
 * Accessible dialog: labelled, traps Tab, closes on Escape or backdrop click,
 * locks page scroll and returns focus to whatever opened it.
 */
export default function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()
  const descId = useId()
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return undefined
    const previouslyFocused = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusTimer = window.setTimeout(() => {
      const panel = panelRef.current
      if (!panel || panel.contains(document.activeElement)) return
      const target = panel.querySelector('[data-autofocus], input:not([type=hidden]):not([type=checkbox]), textarea, select') || panel
      target.focus()
    }, 0)

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current?.()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const nodes = [...panelRef.current.querySelectorAll(FOCUSABLE)].filter(n => n.offsetParent !== null)
      if (nodes.length === 0) { event.preventDefault(); return }
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        event.preventDefault(); last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus?.()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="fade-enter fixed inset-0 z-[60] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.() }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'dialog-enter flex max-h-[92vh] w-full flex-col rounded-t-xl border border-line bg-surface shadow-pop outline-none sm:rounded-lg',
          SIZES[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-text">{title}</h2>
            {description && <p id={descId} className="mt-1 text-[13px] text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-1.5 -mt-1 rounded-md p-1.5 text-muted hover:bg-raised hover:text-text"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
