import { useEffect, useMemo } from 'react'
import { Field, Select } from '@/components/ui/Field'
import { useTaskStore } from '@/stores/taskStore'
import { useTimerStore } from '@/stores/timerStore'
import { dueKey, isOpenTask } from '@/lib/utils'

export default function TaskSelector({ label = 'Working on' }) {
  const allTasks = useTaskStore(s => s.tasks)
  const taskId = useTimerStore(s => s.taskId)
  const setTask = useTimerStore(s => s.setTask)

  const tasks = useMemo(() => allTasks
    .filter(isOpenTask)
    .sort((a, b) => (dueKey(a.dueDate) || '9999').localeCompare(dueKey(b.dueDate) || '9999') || a.title.localeCompare(b.title)),
  [allTasks])

  // If the selected task was completed or deleted, clear it so sessions aren't logged against it.
  useEffect(() => {
    if (taskId && !tasks.some(t => t.id === taskId)) setTask(null)
  }, [taskId, tasks, setTask])

  return (
    <Field label={label}>
      <Select value={taskId && tasks.some(t => t.id === taskId) ? taskId : ''} onChange={(e) => setTask(e.target.value || null)}>
        <option value="">{tasks.length ? 'No task — just focus' : 'No open tasks'}</option>
        {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
      </Select>
    </Field>
  )
}
