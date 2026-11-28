import { useMemo, useState } from 'react'
import { Bell, CheckCheck, Clock, Repeat, Target, Trash2, Check } from 'lucide-react'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import PageHeader from '@/components/ui/PageHeader'
import { FilterTabs } from '@/components/ui/Tabs'
import { useNotificationStore } from '@/stores/notificationStore'
import { cn, dateKey, formatDayHeading, formatDue, formatTimeOfDay } from '@/lib/utils'

const ICONS = { session: Clock, task: Bell, goal: Target, habit: Repeat }

export default function Inbox() {
  const items = useNotificationStore(s => s.items)
  const { markRead, markAllRead, remove, clearAll } = useNotificationStore.getState()
  const [filter, setFilter] = useState('all')
  const [confirmClear, setConfirmClear] = useState(false)
  const unread = items.filter(n => !n.isRead).length
  const shown = filter === 'unread' ? items.filter(n => !n.isRead) : items

  const groups = useMemo(() => {
    const map = new Map()
    shown.forEach(n => { const k = dateKey(new Date(n.createdAt)); map.set(k, [...(map.get(k) || []), n]) })
    return [...map.entries()]
  }, [shown])

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        title="Inbox"
        description="Session and reminder notifications"
        actions={items.length > 0 && (
          <>
            <Button size="sm" onClick={markAllRead} disabled={unread === 0}><CheckCheck size={15} aria-hidden="true" />Mark all read</Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmClear(true)}>Clear all</Button>
          </>
        )}
      />
      <FilterTabs label="Inbox filter" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All', count: items.length }, { value: 'unread', label: 'Unread', count: unread }]} />

      <div className="mt-4">
        {shown.length === 0 ? (
          <div className="panel">
            <EmptyState icon={Bell} title={filter === 'unread' ? 'No unread notifications' : 'Nothing here yet'} description={filter === 'unread' ? 'You’re all caught up.' : 'When a focus session or break ends, it’s recorded here.'} />
          </div>
        ) : groups.map(([key, list]) => (
          <section key={key} className="mb-5">
            <h2 className="mb-2 text-xs font-medium text-muted">{formatDue(key) === 'Today' || formatDue(key) === 'Yesterday' ? formatDue(key) : formatDayHeading(key)}</h2>
            <ul className="panel divide-line overflow-hidden">
              {list.map(n => {
                const Icon = ICONS[n.type] || Bell
                return (
                  <li key={n.id} className="group flex items-start gap-3 px-4 py-3">
                    <Icon size={16} className={cn('mt-0.5 shrink-0', n.isRead ? 'text-faint' : 'text-accent')} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <div className={cn('text-sm', n.isRead ? 'text-muted' : 'font-medium text-text')}>{n.title}{!n.isRead && <span className="sr-only"> (unread)</span>}</div>
                      <div className="text-[13px] text-muted">{n.message}</div>
                    </div>
                    <span className="tnum shrink-0 text-xs text-faint">{formatTimeOfDay(n.createdAt)}</span>
                    <div className="flex shrink-0 items-center">
                      {!n.isRead && <button type="button" onClick={() => markRead(n.id)} aria-label="Mark as read" title="Mark as read" className="rounded-md p-1.5 text-muted hover:bg-raised hover:text-success"><Check size={15} /></button>}
                      <button type="button" onClick={() => remove(n.id)} aria-label="Delete notification" title="Delete" className="rounded-md p-1.5 text-muted hover:bg-danger-soft hover:text-danger"><Trash2 size={15} /></button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>

      <ConfirmDialog open={confirmClear} title="Clear all notifications?" description="Every notification in your inbox will be deleted." confirmLabel="Clear all" destructive onCancel={() => setConfirmClear(false)} onConfirm={() => { clearAll(); setConfirmClear(false) }} />
    </div>
  )
}
