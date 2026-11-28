import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import PageHeader from '@/components/ui/PageHeader'
import { Input, Select } from '@/components/ui/Field'
import { FilterTabs } from '@/components/ui/Tabs'
import { SkeletonRows } from '@/components/ui/Skeleton'
import TaskRow from '@/components/tasks/TaskRow'
import TaskModal from '@/components/tasks/TaskModal'
import QuickAdd from '@/components/tasks/QuickAdd'
import { useTaskStore } from '@/stores/taskStore'
import { useProjectStore } from '@/stores/projectStore'
import { useTimerStore } from '@/stores/timerStore'
import { useSyncStore } from '@/stores/syncStore'
import { PRIORITIES, PRIORITY_LEVEL } from '@/constants'
import { dueKey, formatDayHeading, formatDue, isOpenTask, isOverdue, todayISO } from '@/lib/utils'

const VIEWS = ['open', 'today', 'upcoming', 'overdue', 'completed']
const SORTS = [
  { value: 'due', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
  { value: 'newest', label: 'Newest first' },
  { value: 'title', label: 'Title A–Z' },
]
const EMPTY = {
  open: ['No open tasks', 'Add a task above to get started.'],
  today: ['Nothing due today', 'Tasks with today’s due date appear here.'],
  upcoming: ['Nothing scheduled ahead', 'Give a task a future due date and it will show up here.'],
  overdue: ['No overdue tasks', 'You’re caught up.'],
  completed: ['No completed tasks yet', 'Finished tasks are kept here.'],
}

const byPriority = (a, b) => (PRIORITY_LEVEL[b.priority] || 0) - (PRIORITY_LEVEL[a.priority] || 0)
const SORT_FN = {
  due: (a, b) => (dueKey(a.dueDate) || '9999-99-99').localeCompare(dueKey(b.dueDate) || '9999-99-99') || byPriority(a, b) || (b.createdAt || 0) - (a.createdAt || 0),
  priority: (a, b) => byPriority(a, b) || (dueKey(a.dueDate) || '9999-99-99').localeCompare(dueKey(b.dueDate) || '9999-99-99'),
  newest: (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
  title: (a, b) => a.title.localeCompare(b.title),
}

export default function Tasks() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tasks = useTaskStore(s => s.tasks)
  const { addTask, updateTask, deleteTask, completeTask, reopenTask } = useTaskStore.getState()
  const projects = useProjectStore(s => s.projects)
  const hydrated = useSyncStore(s => s.hydrated)

  const view = VIEWS.includes(params.get('view')) ? params.get('view') : 'open'
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [sort, setSort] = useState('due')
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const editingId = params.get('task')
  const editing = editingId ? tasks.find(t => t.id === editingId) : null
  const today = todayISO()

  const setView = (next) => {
    const p = new URLSearchParams(params)
    if (next === 'open') p.delete('view'); else p.set('view', next)
    setParams(p, { replace: true })
  }
  const closeEditor = () => {
    const p = new URLSearchParams(params)
    p.delete('task')
    setParams(p, { replace: true })
  }

  const counts = useMemo(() => ({
    open: tasks.filter(isOpenTask).length,
    today: tasks.filter(t => isOpenTask(t) && dueKey(t.dueDate) === today).length,
    upcoming: tasks.filter(t => isOpenTask(t) && dueKey(t.dueDate) > today).length,
    overdue: tasks.filter(isOverdue).length,
    completed: tasks.filter(t => t.status === 'completed').length,
  }), [tasks, today])

  const filtered = useMemo(() => {
    let list = tasks.filter(t => {
      const due = dueKey(t.dueDate)
      if (view === 'open') return isOpenTask(t)
      if (view === 'today') return isOpenTask(t) && due === today
      if (view === 'upcoming') return isOpenTask(t) && due && due > today
      if (view === 'overdue') return isOverdue(t)
      return t.status === 'completed'
    })
    const needle = search.trim().toLowerCase()
    if (needle) list = list.filter(t => t.title.toLowerCase().includes(needle) || (t.description || '').toLowerCase().includes(needle))
    if (projectFilter) list = list.filter(t => (projectFilter === 'none' ? !t.projectId : t.projectId === projectFilter))
    if (priorityFilter) list = list.filter(t => t.priority === priorityFilter)
    return view === 'completed'
      ? list.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
      : list.sort(SORT_FN[view === 'upcoming' ? 'due' : sort])
  }, [tasks, view, search, projectFilter, priorityFilter, sort, today])

  // Upcoming is grouped by day so deadlines are easy to scan.
  const groups = useMemo(() => {
    if (view !== 'upcoming') return [{ key: 'all', heading: null, tasks: filtered }]
    const map = new Map()
    filtered.forEach(t => {
      const key = dueKey(t.dueDate)
      map.set(key, [...(map.get(key) || []), t])
    })
    return [...map.entries()].map(([key, list]) => ({ key, heading: `${formatDue(key)} · ${formatDayHeading(key)}`, tasks: list }))
  }, [filtered, view])

  const filtersActive = Boolean(search.trim() || projectFilter || priorityFilter)
  const projectOf = (task) => projects.find(p => p.id === task.projectId)
  const loading = !hydrated && tasks.length === 0

  const toggle = (task) => (task.status === 'completed' ? reopenTask(task.id) : completeTask(task.id))
  const startFocus = (task) => {
    useTimerStore.getState().setTask(task.id)
    toast.success(`Timer set to “${task.title}”`)
    navigate('/focus')
  }
  const quickAdd = (title) => addTask({ title, dueDate: view === 'today' ? new Date(today).toISOString() : null })

  const [emptyTitle, emptyText] = EMPTY[view]

  return (
    <div className="mx-auto w-full max-w-[880px] px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        title="Tasks"
        description={`${counts.open} open · ${counts.completed} completed`}
        actions={<Button variant="primary" onClick={() => setCreating(true)}><Plus size={16} aria-hidden="true" />New task</Button>}
      />

      <FilterTabs
        label="Task view"
        value={view}
        onChange={setView}
        options={[
          { value: 'open', label: 'Open', count: counts.open },
          { value: 'today', label: 'Today', count: counts.today },
          { value: 'upcoming', label: 'Upcoming', count: counts.upcoming },
          { value: 'overdue', label: 'Overdue', count: counts.overdue },
          { value: 'completed', label: 'Completed', count: counts.completed },
        ]}
      />

      <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter by title or notes" aria-label="Filter tasks" className="field-sm pl-9" />
        </div>
        {projects.length > 0 && (
          <Select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} aria-label="Filter by project" className="field-sm sm:w-40">
            <option value="">All projects</option>
            <option value="none">No project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        )}
        <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} aria-label="Filter by priority" className="field-sm sm:w-36">
          <option value="">Any priority</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </Select>
        {view !== 'completed' && view !== 'upcoming' && (
          <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort tasks" className="field-sm sm:w-36">
            {SORTS.map(s => <option key={s.value} value={s.value}>Sort: {s.label}</option>)}
          </Select>
        )}
      </div>

      {view !== 'completed' && (
        <div className="mt-3">
          <QuickAdd onAdd={quickAdd} placeholder={view === 'today' ? 'Add a task due today' : 'Add a task and press Enter'} />
        </div>
      )}

      <div className="panel mt-4 overflow-hidden">
        {loading ? <SkeletonRows count={5} /> : filtered.length === 0 ? (
          filtersActive ? (
            <EmptyState
              icon={Search}
              title="No tasks match these filters"
              description="Try a different search, or clear the filters."
              action={<Button onClick={() => { setSearch(''); setProjectFilter(''); setPriorityFilter('') }}>Clear filters</Button>}
            />
          ) : (
            <EmptyState icon={Check} title={emptyTitle} description={emptyText} />
          )
        ) : groups.map(group => (
          <section key={group.key} aria-label={group.heading || undefined}>
            {group.heading && <h2 className="border-b border-line bg-raised/50 px-4 py-2 text-xs font-medium text-muted">{group.heading}</h2>}
            <div className="divide-line [&:not(:last-child)]:border-b [&:not(:last-child)]:border-line">
              {group.tasks.map(task => (
                <TaskRow key={task.id} task={task} project={projectOf(task)} onToggle={toggle} onEdit={(t) => setParams(new URLSearchParams({ ...Object.fromEntries(params), task: t.id }), { replace: true })} onDelete={setDeleting} onFocus={startFocus} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <TaskModal
        open={creating}
        onClose={() => setCreating(false)}
        projects={projects}
        defaults={{ dueDate: view === 'today' ? today : '' }}
        onSave={(data) => { addTask(data); setCreating(false); toast.success('Task created') }}
      />
      <TaskModal
        open={Boolean(editing)}
        task={editing}
        projects={projects}
        onClose={closeEditor}
        onSave={(data) => { updateTask(editing.id, data); closeEditor(); toast.success('Task updated') }}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this task?"
        description={deleting ? `“${deleting.title}” will be removed permanently. Focus sessions you logged on it are kept.` : ''}
        confirmLabel="Delete task"
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={() => { deleteTask(deleting.id); setDeleting(null); toast.success('Task deleted') }}
      />
    </div>
  )
}
