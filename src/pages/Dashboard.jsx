import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import CircularTimer from '@/components/timer/CircularTimer'
import TimerControls from '@/components/timer/TimerControls'
import TaskSelector from '@/components/timer/TaskSelector'
import TaskRow from '@/components/tasks/TaskRow'
import TaskModal from '@/components/tasks/TaskModal'
import QuickAdd from '@/components/tasks/QuickAdd'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ProgressBar from '@/components/ui/ProgressBar'
import { Segmented } from '@/components/ui/Tabs'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { useTaskStore } from '@/stores/taskStore'
import { useProjectStore } from '@/stores/projectStore'
import { useGoalStore } from '@/stores/goalStore'
import { useTimerStore } from '@/stores/timerStore'
import { useAuthStore } from '@/stores/authStore'
import { useSyncStore } from '@/stores/syncStore'
import { useProgress } from '@/hooks/useProgress'
import { PRIORITY_LEVEL } from '@/constants'
import { cn, dueKey, formatMinutes, formatTimeOfDay, greetingFor, isOpenTask, todayISO } from '@/lib/utils'

const MODE_OPTIONS = [
  { value: 'focus', label: 'Focus' },
  { value: 'short_break', label: 'Short' },
  { value: 'long_break', label: 'Long' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const tasks = useTaskStore(s => s.tasks)
  const { addTask, updateTask, deleteTask, completeTask, reopenTask } = useTaskStore.getState()
  const projects = useProjectStore(s => s.projects)
  const goals = useGoalStore(s => s.goals)
  const mode = useTimerStore(s => s.mode)
  const setMode = useTimerStore(s => s.setMode)
  const hydrated = useSyncStore(s => s.hydrated)
  const user = useAuthStore(s => s.user)
  const progress = useProgress()

  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const firstName = user?.user_metadata?.full_name?.trim().split(/\s+/)[0]
  const today = todayISO()

  const dueNow = useMemo(() => tasks
    .filter(t => isOpenTask(t) && dueKey(t.dueDate) && dueKey(t.dueDate) <= today)
    .sort((a, b) => dueKey(a.dueDate).localeCompare(dueKey(b.dueDate)) || (PRIORITY_LEVEL[b.priority] || 0) - (PRIORITY_LEVEL[a.priority] || 0)),
  [tasks, today])

  const loading = !hydrated && tasks.length === 0
  const projectOf = (task) => projects.find(p => p.id === task.projectId)
  const maxDay = Math.max(1, ...progress.week.map(d => d.minutes))

  const toggle = (task) => (task.status === 'completed' ? reopenTask(task.id) : completeTask(task.id))
  const startFocus = (task) => {
    useTimerStore.getState().setTask(task.id)
    toast.success(`Timer set to “${task.title}”`)
    navigate('/focus')
  }

  const goalRows = [
    { label: 'Focus time', current: progress.todayMinutes, target: goals.focusMinutes, format: (v) => formatMinutes(v), unit: '' },
    { label: 'Sessions', current: progress.todaySessions, target: goals.pomodoros, format: (v) => String(v) },
    { label: 'Tasks completed', current: progress.completedToday.length, target: goals.tasks, format: (v) => String(v) },
  ]

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6">
        <h1 className="text-[22px] font-semibold leading-tight tracking-tight">{greetingFor()}{firstName ? `, ${firstName}` : ''}</h1>
        <p className="mt-1 text-[13px] text-muted">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="today-heading" className="panel">
            <div className="flex items-baseline justify-between gap-3 px-4 pb-3 pt-4">
              <h2 id="today-heading" className="text-[15px] font-semibold">Due today</h2>
              <Link to="/tasks" className="text-[13px] text-muted hover:text-accent">All tasks</Link>
            </div>
            <div className="px-4 pb-3">
              <QuickAdd
                placeholder="Add a task for today"
                onAdd={(title) => addTask({ title, dueDate: new Date(today).toISOString() })}
              />
            </div>
            {loading ? <SkeletonRows count={3} /> : dueNow.length === 0 ? (
              <p className="border-t border-line px-4 py-8 text-center text-[13px] text-muted">
                {progress.completedToday.length > 0
                  ? 'Everything due today is done.'
                  : 'Nothing due today. Add a task above, or choose one from your task list.'}
              </p>
            ) : (
              <div className="divide-line border-t border-line">
                {dueNow.slice(0, 8).map(task => (
                  <TaskRow key={task.id} task={task} project={projectOf(task)} onToggle={toggle} onEdit={setEditing} onDelete={setDeleting} onFocus={startFocus} />
                ))}
                {dueNow.length > 8 && (
                  <Link to="/tasks?view=today" className="block px-4 py-3 text-[13px] text-muted hover:text-accent">
                    {dueNow.length - 8} more due today or overdue
                  </Link>
                )}
              </div>
            )}
            {progress.completedToday.length > 0 && (
              <details className="border-t border-line">
                <summary className="cursor-pointer px-4 py-3 text-[13px] text-muted hover:text-text">
                  Completed today <span className="tnum">({progress.completedToday.length})</span>
                </summary>
                <div className="divide-line border-t border-line">
                  {progress.completedToday.slice(0, 10).map(task => (
                    <TaskRow key={task.id} task={task} project={projectOf(task)} onToggle={toggle} onEdit={setEditing} onDelete={setDeleting} />
                  ))}
                </div>
              </details>
            )}
          </section>

          {progress.weekMinutes > 0 && (
            <section aria-labelledby="week-heading" className="panel p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="week-heading" className="text-[15px] font-semibold">This week</h2>
                <span className="tnum text-[13px] text-muted">{formatMinutes(progress.weekMinutes)} focused</span>
              </div>
              <div className="mt-4 grid grid-cols-7 gap-2" role="list">
                {progress.week.map(day => (
                  <div key={day.key} role="listitem" className="flex flex-col items-center gap-1.5" aria-label={`${day.label}: ${formatMinutes(day.minutes)}`}>
                    <div className="flex h-24 w-full items-end">
                      <div
                        className={cn('w-full rounded-t-[3px]', day.isToday ? 'bg-accent' : 'bg-line-strong')}
                        style={{ height: day.minutes ? `${Math.max(4, (day.minutes / maxDay) * 100)}%` : 2, opacity: day.minutes ? 1 : 0.5 }}
                      />
                    </div>
                    <span className={cn('text-xs', day.isToday ? 'font-semibold text-text' : 'text-muted')}>{day.label}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          <section aria-labelledby="timer-heading" className="panel p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="timer-heading" className="text-[15px] font-semibold">Timer</h2>
              <Segmented size="sm" label="Timer mode" value={mode} onChange={setMode} options={MODE_OPTIONS} />
            </div>
            <CircularTimer size={236} />
            <div className="mt-4"><TimerControls size="md" /></div>
            <div className="mt-4"><TaskSelector /></div>
            <Link to="/focus" className="mt-3 inline-block text-[13px] text-muted hover:text-accent">Open full-screen focus view</Link>
          </section>

          <section aria-labelledby="goals-heading" className="panel p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="goals-heading" className="text-[15px] font-semibold">Today’s goals</h2>
              <Link to="/goals" className="text-[13px] text-muted hover:text-accent">Edit</Link>
            </div>
            <div className="mt-4 space-y-4">
              {goalRows.map(row => (
                <div key={row.label}>
                  <div className="mb-1.5 flex justify-between text-[13px]">
                    <span className="text-muted">{row.label}</span>
                    <span className="tnum text-text">{row.format(row.current)} <span className="text-faint">of {row.format(row.target)}</span></span>
                  </div>
                  <ProgressBar value={row.current} max={row.target || 1} label={`${row.label} today`} />
                </div>
              ))}
            </div>
          </section>

          {progress.recent.length > 0 && (
            <section aria-labelledby="recent-heading" className="panel">
              <h2 id="recent-heading" className="px-4 pb-2 pt-4 text-[15px] font-semibold">Recent sessions</h2>
              <ul className="divide-line pb-1">
                {progress.recent.map(session => {
                  const task = tasks.find(t => t.id === session.taskId)
                  return (
                    <li key={session.id} className="flex items-center gap-3 px-4 py-2.5 text-[13px]">
                      <span className="min-w-0 flex-1 truncate text-text">{task?.title || 'Untitled session'}</span>
                      <span className="tnum shrink-0 text-muted">{Math.round(session.actualDurationSeconds / 60)}m</span>
                      <span className="tnum w-16 shrink-0 text-right text-faint">{formatTimeOfDay(session.endedAt)}</span>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </div>
      </div>

      <TaskModal
        open={Boolean(editing)}
        task={editing}
        projects={projects}
        onClose={() => setEditing(null)}
        onSave={(data) => { updateTask(editing.id, data); setEditing(null); toast.success('Task updated') }}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this task?"
        description={deleting ? `“${deleting.title}” will be removed permanently.` : ''}
        confirmLabel="Delete task"
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={() => { deleteTask(deleting.id); setDeleting(null); toast.success('Task deleted') }}
      />
    </div>
  )
}
