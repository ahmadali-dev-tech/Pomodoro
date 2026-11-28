import { Link } from 'react-router-dom'
import { Bell, Menu, Moon, Sun } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { useResolvedTheme } from '@/hooks/useResolvedTheme'
import Avatar from '@/components/ui/Avatar'
import SearchBox from './SearchBox'
import MiniTimer from './MiniTimer'
import SyncStatus from './SyncStatus'
import { useDisplayName } from './AppSidebar'

export default function AppHeader() {
  const setTheme = useUIStore(s => s.setTheme)
  const setMobileNavOpen = useUIStore(s => s.setMobileNavOpen)
  const resolved = useResolvedTheme()
  const unread = useNotificationStore(s => s.items.filter(n => !n.isRead).length)
  const name = useDisplayName()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-bg px-3 md:px-6">
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation menu"
        className="rounded-md p-2 text-muted hover:bg-raised hover:text-text md:hidden"
      >
        <Menu size={19} />
      </button>

      <SearchBox />

      <div className="ml-auto flex items-center gap-1">
        <MiniTimer />
        <SyncStatus />
        <button
          type="button"
          onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
          aria-label={resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className="rounded-md p-2 text-muted hover:bg-raised hover:text-text"
        >
          {resolved === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <Link
          to="/inbox"
          aria-label={unread > 0 ? `Inbox, ${unread} unread` : 'Inbox'}
          title="Inbox"
          className="relative rounded-md p-2 text-muted hover:bg-raised hover:text-text"
        >
          <Bell size={17} />
          {unread > 0 && (
            <span className="tnum absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-fg">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>
        <Link to="/settings" aria-label="Account settings" title={name} className="ml-1 hidden rounded-full sm:block">
          <Avatar name={name} size={28} />
        </Link>
      </div>
    </header>
  )
}
