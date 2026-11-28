import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import { NAV_SECTIONS } from '@/constants'
import Logo from './Logo'
import { SidebarFooter, SidebarNav } from './AppSidebar'

const PRIMARY_PATHS = ['/', '/focus', '/tasks', '/projects']

/** Bottom tab bar for phones: the four things used most, plus a menu for everything else. */
export function BottomNav() {
  const setOpen = useUIStore(s => s.setMobileNavOpen)
  const items = NAV_SECTIONS.flatMap(s => s.items).filter(i => PRIMARY_PATHS.includes(i.path))
  return (
    <nav aria-label="Main" className="safe-bottom fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface md:hidden">
      {items.map(({ path, label, icon: Icon, end }) => (
        <NavLink
          key={path}
          to={path}
          end={end}
          className={({ isActive }) => cn('flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium', isActive ? 'text-accent' : 'text-muted')}
        >
          <Icon size={19} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
      <button type="button" onClick={() => setOpen(true)} className="flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted">
        <Menu size={19} aria-hidden="true" />
        More
      </button>
    </nav>
  )
}

export function MobileDrawer() {
  const open = useUIStore(s => s.mobileNavOpen)
  const setOpen = useUIStore(s => s.setMobileNavOpen)
  const location = useLocation()
  const panelRef = useRef(null)

  useEffect(() => { setOpen(false) }, [location.pathname, setOpen])

  useEffect(() => {
    if (!open) return undefined
    const previous = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.querySelector('a, button')?.focus()
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [open, setOpen])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fade-enter absolute inset-0 bg-black/55" onClick={() => setOpen(false)} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="drawer-enter absolute inset-y-0 left-0 flex w-[17rem] max-w-[85vw] flex-col border-r border-line bg-surface shadow-pop"
      >
        <div className="flex h-14 items-center gap-2.5 border-b border-line px-4">
          <Logo size={24} />
          <span className="text-[15px] font-semibold tracking-tight text-text">Pomodoro</span>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="ml-auto rounded-md p-1.5 text-muted hover:bg-raised hover:text-text">
            <X size={18} />
          </button>
        </div>
        <SidebarNav onNavigate={() => setOpen(false)} />
        <SidebarFooter onNavigate={() => setOpen(false)} />
      </div>
    </div>
  )
}
