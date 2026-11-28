import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import PageHeader from '@/components/ui/PageHeader'
import { Segmented } from '@/components/ui/Tabs'
import TaskRow from '@/components/tasks/TaskRow'
import TaskModal from '@/components/tasks/TaskModal'
import { useTaskStore } from '@/stores/taskStore'
import { useProjectStore } from '@/stores/projectStore'
import { useTimerStore } from '@/stores/timerStore'
import { cn, dateKey, dueKey, startOfWeek } from '@/lib/utils'

const addDays = (date, n) => { const d = new Date(date); d.setDate(d.getDate() + n); return d }
const DOT = { low: 'bg-faint', medium: 'bg-muted', high: 'bg-warning', urgent: 'bg-danger' }

export default function Calendar() {
  const navigate = useNavigate()
  const tasks = useTaskStore(s => s.tasks)
  const { addTask, updateTask, deleteTask, completeTask, reopenTask } = useTaskStore.getState()
  const projects = useProjectStore(s => s.projects)

  const [cursor, setCursor] = useState(() => new Date())
  const [selected, setSelected] = useState(() => new Date())
  const [view, setView] = useState('month')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const todayKey = dateKey(new Date())
  const selectedKey = dateKey(selected)

  const days = useMemo(() => {
    if (view === 'week') return Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i))
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
    const out = []
    for (let d = startOfWeek(first); d <= addDays(startOfWeek(last), 6); d = addDays(d, 1)) out.push(d)
    return out
  }, [cursor, view])

  const byDay = useMemo(() => {
    const map = new Map()
    tasks.forEach(t => { const k = dueKey(t.dueDate); if (k) map.set(k, [...(map.get(k) || []), t]) })
    return map
  }, [tasks])

  const dayTasks = byDay.get(selectedKey) || []
  const done = dayTasks.filter(t => t.status === 'completed').length

  const move = (dir) => setCursor(c => (view === 'week' ? addDays(c, dir * 7) : new Date(c.getFullYear(), c.getMonth() + dir, 1)))
  const goToday = () => { const n = new Date(); setCursor(n); setSelected(n) }
  const title = view === 'month'
    ? cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : `${days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  const toggle = (t) => (t.status === 'completed' ? reopenTask(t.id) : completeTask(t.id))

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-6 md:px-8 md:py-8">
      <PageHeader title="Calendar" description="Tasks by due date" actions={<Button variant="primary" onClick={() => setCreating(true)}><Plus size={16} aria-hidden="true" />New task</Button>} />

      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => move(-1)} aria-label={view === 'week' ? 'Previous week' : 'Previous month'} className="rounded-md p-1.5 text-muted hover:bg-raised hover:text-text"><ChevronLeft size={18} /></button>
            <h2 className="min-w-[10rem] text-center text-[15px] font-semibold" aria-live="polite">{title}</h2>
            <button type="button" onClick={() => move(1)} aria-label={view === 'week' ? 'Next week' : 'Next month'} className="rounded-md p-1.5 text-muted hover:bg-raised hover:text-text"><ChevronRight size={18} /></button>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={goToday}>Today</Button>
            <Segmented size="sm" label="Calendar view" value={view} onChange={setView} options={[{ value: 'month', label: 'Month' }, { value: 'week', label: 'Week' }]} />
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-line bg-raised/50 text-center text-xs font-medium text-muted">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d} className="py-2"><span className="hidden sm:inline">{d}</span><span className="sm:hidden">{d[0]}</span></div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((date, i) => {
            const key = dateKey(date)
            const list = byDay.get(key) || []
            const inMonth = view === 'week' || date.getMonth() === cursor.getMonth()
            const isSel = key === selectedKey
            return (
              <button
                key={key}
                type="button"
                onClick={() => { setSelected(date); if (view === 'month' && !inMonth) setCursor(new Date(date.getFullYear(), date.getMonth(), 1)) }}
                aria-pressed={isSel}
                aria-label={`${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}, ${list.length} ${list.length === 1 ? 'task' : 'tasks'}`}
                className={cn(
                  'flex h-16 flex-col items-center gap-1.5 border-b border-line p-1.5 transition-colors hover:bg-raised sm:h-20 sm:p-2',
                  i % 7 !== 6 && 'border-r', isSel && 'bg-accent-soft', !inMonth && 'text-faint',
                )}
              >
                <span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-[13px] tnum', key === todayKey ? 'bg-accent font-semibold text-accent-fg' : isSel ? 'font-semibold text-text' : '')}>{date.getDate()}</span>
                {list.length > 0 && (
                  <span className="flex items-center gap-0.5">
                    {list.slice(0, 3).map(t => <span key={t.id} className={cn('h-1.5 w-1.5 rounded-full', t.status === 'completed' ? 'bg-success' : DOT[t.priority] || 'bg-muted')} />)}
                    {list.length > 3 && <span className="tnum ml-0.5 text-[10px] text-muted">+{list.length - 3}</span>}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 px-4 py-2.5 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-muted" />Open</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-warning" />High</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-danger" />Urgent</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-success" />Completed</span>
        </div>
      </div>

      <section aria-labelledby="day-heading" className="mt-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="day-heading" className="text-[15px] font-semibold">{selected.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
            <p className="tnum text-xs text-muted">{dayTasks.length ? `${done} of ${dayTasks.length} done` : 'Nothing scheduled'}</p>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}><Plus size={14} aria-hidden="true" />Add task</Button>
        </div>
        {dayTasks.length === 0 ? (
          <div className="panel flex flex-col items-center px-4 py-10 text-center"><CalendarDays size={22} className="mb-2 text-faint" aria-hidden="true" /><p className="text-[13px] text-muted">No tasks are due on this day.</p></div>
        ) : (
          <div className="panel divide-line overflow-hidden">
            {dayTasks.map(t => (
              <TaskRow key={t.id} task={t} project={projects.find(p => p.id === t.projectId)} onToggle={toggle} onEdit={setEditing} onDelete={setDeleting}
                onFocus={(task) => { useTimerStore.getState().setTask(task.id); navigate('/focus') }} />
            ))}
          </div>
        )}
      </section>

      <TaskModal open={creating} onClose={() => setCreating(false)} projects={projects} defaults={{ dueDate: selectedKey }} onSave={(data) => { addTask(data); setCreating(false); toast.success('Task created') }} />
      <TaskModal open={Boolean(editing)} task={editing} projects={projects} onClose={() => setEditing(null)} onSave={(data) => { updateTask(editing.id, data); setEditing(null); toast.success('Task updated') }} />
      <ConfirmDialog open={Boolean(deleting)} title="Delete this task?" description={deleting ? `“${deleting.title}” will be removed permanently.` : ''} confirmLabel="Delete task" destructive onCancel={() => setDeleting(null)} onConfirm={() => { deleteTask(deleting.id); setDeleting(null); toast.success('Task deleted') }} />
    </div>
  )
}
