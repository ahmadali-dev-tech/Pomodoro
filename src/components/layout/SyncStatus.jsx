import { Cloud, AlertTriangle, CloudOff, Loader2 } from 'lucide-react'
import { useSyncStore } from '@/stores/syncStore'
import { useAuthStore } from '@/stores/authStore'

const timeFormat = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function SyncStatus() {
  const user = useAuthStore(s => s.user)
  const status = useSyncStore(s => s.status)
  const loadError = useSyncStore(s => s.loadError)
  const lastSyncedAt = useSyncStore(s => s.lastSyncedAt)
  const requestRetry = useSyncStore(s => s.requestRetry)
  const requestSave = useSyncStore(s => s.requestSave)
  if (!user) return null

  if (status === 'error') {
    return (
      <button
        type="button"
        onClick={loadError ? requestRetry : requestSave}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-medium text-danger hover:bg-danger-soft"
        title={loadError ? `Couldn’t load your saved data: ${loadError}` : 'Your last change did not upload.'}
      >
        <AlertTriangle size={16} aria-hidden="true" />
        <span className="hidden lg:inline">Not synced · Retry</span>
        <span className="sr-only lg:hidden">Not synced. Retry</span>
      </button>
    )
  }

  const map = {
    offline: { Icon: CloudOff, label: 'Offline', tone: 'text-warning', hint: 'Offline. Changes are saved on this device and will sync when you reconnect.' },
    syncing: { Icon: Loader2, label: 'Saving…', tone: 'text-muted', hint: 'Syncing with your account…', spin: true },
  }[status] || {
    Icon: Cloud, label: 'Saved', tone: 'text-muted',
    hint: lastSyncedAt ? `Synced at ${timeFormat(lastSyncedAt)}` : 'Synced with your account',
  }

  return (
    <div role="status" className={`flex items-center gap-1.5 px-2 py-1.5 text-[13px] ${map.tone}`} title={map.hint}>
      <map.Icon size={16} className={map.spin ? 'animate-spin' : undefined} aria-hidden="true" />
      <span className="hidden lg:inline">{map.label}</span>
      <span className="sr-only lg:hidden">{map.hint}</span>
    </div>
  )
}
