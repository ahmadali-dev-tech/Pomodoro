import { Outlet, useLocation } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import AppSidebar from './AppSidebar'
import AppHeader from './AppHeader'
import { BottomNav, MobileDrawer } from './MobileNav'
import Button from '@/components/ui/Button'
import { useSyncStore } from '@/stores/syncStore'

function SyncBanner() {
  const loadError = useSyncStore(s => s.loadError)
  const requestRetry = useSyncStore(s => s.requestRetry)
  if (!loadError) return null
  return (
    <div role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-warning-soft px-4 py-2.5 text-[13px] text-text md:px-6">
      <AlertTriangle size={16} className="shrink-0 text-warning" aria-hidden="true" />
      <p className="min-w-0 flex-1">
        We couldn’t load your saved data from the cloud. You’re seeing the copy on this device, and your changes won’t upload until this is resolved.
      </p>
      <Button size="sm" variant="secondary" onClick={requestRetry}>Retry</Button>
    </div>
  )
}

export default function MainLayout() {
  const { pathname } = useLocation()
  return (
    <div className="flex min-h-screen bg-bg">
      <a href="#main" className="sr-only-focusable fixed left-3 top-3 z-[70] rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg">
        Skip to content
      </a>
      <AppSidebar />
      <MobileDrawer />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <SyncBanner />
        <main id="main" tabIndex={-1} className="flex-1 pb-20 outline-none md:pb-0">
          <div key={pathname} className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
