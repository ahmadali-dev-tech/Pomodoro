import { NavLink } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { NAV_SECTIONS, UPGRADE_NAV } from '@/constants'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { cn } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import Logo from './Logo'

export function useDisplayName() {
  const user = useAuthStore(s => s.user)
  return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest'
}

export function NavItem({ item, collapsed = false, onNavigate, badge }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.path}
      end={item.end}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={({ isActive }) => cn(
        'group relative flex h-8 items-center rounded-md text-[13.5px] transition-colors',
        collapsed ? 'justify-center' : 'gap-2.5 px-2.5',
        isActive ? 'bg-raised font-medium text-text' : 'text-muted hover:bg-raised hover:text-text',
      )}
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute -left-2 top-1.5 bottom-1.5 w-[3px] rounded-full bg-accent" aria-hidden="true" />}
          <Icon size={17} className={cn('shrink-0', isActive ? 'text-accent' : 'text-faint group-hover:text-muted')} aria-hidden="true" />
          {!collapsed && <span className="truncate">{item.label}</span>}
          {!collapsed && badge > 0 && <span className="tnum ml-auto rounded-full bg-accent-soft px-1.5 text-[11px] font-semibold text-accent">{badge > 99 ? '99+' : badge}</span>}
        </>
      )}
    </NavLink>
  )
}

export function SidebarNav({ collapsed = false, onNavigate }) {
  const unread = useNotificationStore(s => s.items.filter(n => !n.isRead).length)
  return (
    <nav aria-label="Primary" className="scroll-quiet flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          {!collapsed && <div className="mb-1.5 px-2.5 text-xs font-medium text-faint">{section.title}</div>}
          <div className="space-y-0.5">
            {section.items.map(item => (
              <NavItem key={item.path} item={item} collapsed={collapsed} onNavigate={onNavigate} badge={item.path === '/inbox' ? unread : 0} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

export function SidebarFooter({ collapsed = false, onNavigate }) {
  const name = useDisplayName()
  const user = useAuthStore(s => s.user)
  return (
    <div className="space-y-1 border-t border-line p-3">
      <NavItem item={UPGRADE_NAV} collapsed={collapsed} onNavigate={onNavigate} />
      <NavLink
        to="/settings"
        onClick={onNavigate}
        title={collapsed ? `${name} — account settings` : undefined}
        className={cn('flex items-center rounded-md p-1.5 hover:bg-raised', collapsed ? 'justify-center' : 'gap-2.5')}
      >
        <Avatar name={name} size={28} />
        {!collapsed && (
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[13px] font-medium text-text">{name}</span>
            <span className="block truncate text-xs text-muted">{user?.email}</span>
          </span>
        )}
      </NavLink>
    </div>
  )
}

export default function AppSidebar() {
  const collapsed = useUIStore(s => s.sidebarCollapsed)
  const toggle = useUIStore(s => s.toggleSidebar)

  return (
    <aside
      className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-150 md:flex"
      style={{ width: collapsed ? 64 : 232 }}
    >
      <div className={cn('flex h-14 items-center border-b border-line', collapsed ? 'justify-center' : 'gap-2.5 px-4')}>
        {!collapsed && (
          <>
            <Logo size={24} />
            <span className="text-[15px] font-semibold tracking-tight text-text">Pomodoro</span>
          </>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn('rounded-md p-1.5 text-faint hover:bg-raised hover:text-text', !collapsed && 'ml-auto')}
        >
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>
      <SidebarNav collapsed={collapsed} />
      <SidebarFooter collapsed={collapsed} />
    </aside>
  )
}
