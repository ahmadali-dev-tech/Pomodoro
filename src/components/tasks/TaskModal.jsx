import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { PRIORITIES } from '@/constants'
import { dueKey, dueToStored } from '@/lib/utils'

const label = (p) => p.charAt(0).toUpperCase() + p.slice(1)

function TaskForm({ task, defaults, projects, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    priority: task?.priority ?? 'medium',
    dueDate: dueKey(task?.dueDate) ?? defaults?.dueDate ?? '',
    projectId: task?.projectId ?? defaults?.projectId ?? '',
    estimatedPomodoros: String(task?.estimatedPomodoros ?? 1),
  })
  const [errors, setErrors] = useState({})
  const set = (key) => (event) => setForm(f => ({ ...f, [key]: event.target.value }))

  const submit = (event) => {
    event.preventDefault()
    const next = {}
    const title = form.title.trim()
    const sessions = Number(form.estimatedPomodoros)
    if (!title) next.title = 'Give the task a title.'
    else if (title.length > 200) next.title = 'Keep the title under 200 characters.'
    if (!Number.isInteger(sessions) || sessions < 1 || sessions > 20) next.estimatedPomodoros = 'Enter a whole number from 1 to 20.'
    setErrors(next)
    if (Object.keys(next).length) return
    onSave({
      title,
      description: form.description.trim(),
      priority: form.priority,
      dueDate: dueToStored(form.dueDate),
      projectId: form.projectId,
      estimatedPomodoros: sessions,
    })
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4" id="task-form">
      <Field label="Title" error={errors.title}>
        <Input value={form.title} onChange={set('title')} placeholder="What needs to get done?" autoComplete="off" />
      </Field>
      <Field label="Notes" optional>
        <Textarea value={form.description} onChange={set('description')} rows={3} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Due date" optional>
          <Input type="date" value={form.dueDate} onChange={set('dueDate')} />
        </Field>
        <Field label="Priority">
          <Select value={form.priority} onChange={set('priority')}>
            {PRIORITIES.map(p => <option key={p} value={p}>{label(p)}</option>)}
          </Select>
        </Field>
        <Field label="Project" optional>
          <Select value={form.projectId} onChange={set('projectId')}>
            <option value="">No project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <Field label="Estimated sessions" error={errors.estimatedPomodoros}>
          <Input type="number" inputMode="numeric" min={1} max={20} value={form.estimatedPomodoros} onChange={set('estimatedPomodoros')} />
        </Field>
      </div>
      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit">{task ? 'Save changes' : 'Create task'}</Button>
      </div>
    </form>
  )
}

/** Create or edit a task. `defaults` pre-fills a new task (for example the due date of the selected day). */
export default function TaskModal({ open, onClose, task, defaults, projects, onSave }) {
  return (
    <Modal open={open} onClose={onClose} title={task ? 'Edit task' : 'New task'}>
      <TaskForm task={task} defaults={defaults} projects={projects} onSave={onSave} onCancel={onClose} />
    </Modal>
  )
}
