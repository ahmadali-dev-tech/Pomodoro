import { useMemo, useState } from 'react'
import { Check, Flame, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import ColorPicker from '@/components/ui/ColorPicker'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import PageHeader from '@/components/ui/PageHeader'
import { Field, Input } from '@/components/ui/Field'
import { useHabitStore } from '@/stores/habitStore'
import { useToday } from '@/hooks/useProgress'
import { cn, dateKey, parseKey } from '@/lib/utils'

const WEEKDAYS = [
  { value: 1, label: 'Mon' }, { value: 2, label: 'Tue' }, { value: 3, label: 'Wed' }, { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' }, { value: 6, label: 'Sat' }, { value: 0, label: 'Sun' },
]
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]
const BLANK = { title: '', description: '', scheduledDays: ALL_DAYS, color: '#3FA876' }

/** Consecutive scheduled days completed, counting back from today (today may still be open). */
function streakFor(habit, today) {
  const days = habit.scheduledDays || ALL_DAYS
  const logs = new Set(habit.logs)
  const cursor = parseKey(today)
  let streak = 0
  for (let checked = 0; checked < 400; checked++) {
    const key = dateKey(cursor)
    if (days.includes(cursor.getDay())) {
      if (logs.has(key)) streak++
      else if (key !== today) break
    }
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export default function Habits() {
  const habits = useHabitStore(s => s.habits)
  const { addHabit, updateHabit, toggleLog, deleteHabit } = useHabitStore.getState()
  const today = useToday()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [errors, setErrors] = useState({})
  const [deleting, setDeleting] = useState(null)

  const last7 = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = parseKey(today)
    d.setDate(d.getDate() - (6 - i))
    return { key: dateKey(d), weekday: d.getDay(), letter: d.toLocaleDateString('en-US', { weekday: 'narrow' }), name: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) }
  }), [today])

  const openNew = () => { setEditing(null); setForm(BLANK); setErrors({}); setFormOpen(true) }
  const openEdit = (habit) => {
    setEditing(habit)
    setForm({ title: habit.title || '', description: habit.description || '', scheduledDays: habit.scheduledDays || ALL_DAYS, color: habit.color || BLANK.color })
    setErrors({})
    setFormOpen(true)
  }
  const close = () => { setFormOpen(false); setEditing(null) }

  const submit = (event) => {
    event.preventDefault()
    const next = {}
    if (!form.title.trim()) next.title = 'Give the habit a name.'
    if (!form.scheduledDays.length) next.days = 'Choose at least one day.'
    setErrors(next)
    if (Object.keys(next).length) return
    const data = {
      title: form.title.trim(), description: form.description.trim(), scheduledDays: form.scheduledDays, color: form.color,
      targetPerWeek: form.scheduledDays.length, frequency: form.scheduledDays.length === 7 ? 'daily' : 'custom',
    }
    if (editing) { updateHabit(editing.id, data); toast.success('Habit updated') }
    else { addHabit(data); toast.success('Habit created') }
    close()
  }

  return (
    <div className="mx-auto w-full max-w-[760px] px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        title="Habits"
        description="Tap a day to log it. Only scheduled days count toward streaks."
        actions={<Button variant="primary" onClick={openNew}><Plus size={16} aria-hidden="true" />New habit</Button>}
      />

      {habits.length === 0 ? (
        <div className="panel"><EmptyState icon={Flame} title="No habits yet" description="Add something you want to do regularly, like reading or a walk, and log it each day." action={<Button variant="primary" onClick={openNew}>Create a habit</Button>} /></div>
      ) : (
        <ul className="panel divide-line overflow-hidden">
          {habits.map(habit => {
            const days = habit.scheduledDays || ALL_DAYS
            const streak = streakFor(habit, today)
            const scheduled = last7.filter(d => days.includes(d.weekday))
            const hit = scheduled.filter(d => habit.logs.includes(d.key)).length
            return (
              <li key={habit.id} className="group px-4 py-4">
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: habit.color }} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-text">{habit.title}</div>
                    {habit.description && <div className="text-xs text-muted">{habit.description}</div>}
                  </div>
                  <div className="tnum flex shrink-0 items-center gap-1 text-[13px] text-muted" title="Current streak">
                    <Flame size={14} className={streak > 0 ? 'text-warning' : 'text-faint'} aria-hidden="true" />
                    {streak} {streak === 1 ? 'day' : 'days'}
                  </div>
                  <div className="flex shrink-0 items-center md:opacity-0 md:transition-opacity md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                    <button type="button" onClick={() => openEdit(habit)} aria-label={`Edit ${habit.title}`} className="rounded-md p-1.5 text-muted hover:bg-raised hover:text-text"><Pencil size={15} /></button>
                    <button type="button" onClick={() => setDeleting(habit)} aria-label={`Delete ${habit.title}`} className="rounded-md p-1.5 text-muted hover:bg-danger-soft hover:text-danger"><Trash2 size={15} /></button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-7 gap-1.5 pl-[22px]">
                  {last7.map(d => {
                    const isScheduled = days.includes(d.weekday)
                    const done = habit.logs.includes(d.key)
                    return (
                      <div key={d.key} className="flex flex-col items-center gap-1">
                        <button
                          type="button"
                          disabled={!isScheduled}
                          onClick={() => toggleLog(habit.id, d.key)}
                          aria-pressed={done}
                          aria-label={`${habit.title}, ${d.name}${isScheduled ? '' : ' (not scheduled)'}`}
                          className={cn(
                            'flex h-8 w-full max-w-[2.75rem] items-center justify-center rounded-md border transition-colors',
                            done ? 'border-transparent text-white' : isScheduled ? 'border-line-strong text-transparent hover:border-muted' : 'border-dashed border-line text-transparent opacity-50',
                            d.key === today && !done && 'border-accent',
                          )}
                          style={done ? { background: habit.color } : undefined}
                        >
                          <Check size={15} strokeWidth={3} />
                        </button>
                        <span className={cn('text-xs', d.key === today ? 'font-semibold text-text' : 'text-faint')}>{d.letter}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="tnum mt-2 pl-[22px] text-xs text-muted">{scheduled.length ? `${hit} of ${scheduled.length} scheduled days this week` : 'No scheduled days in the last 7 days'}</div>
              </li>
            )
          })}
        </ul>
      )}

      <Modal open={formOpen} onClose={close} title={editing ? 'Edit habit' : 'New habit'}>
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Name" error={errors.title}><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={80} autoComplete="off" /></Field>
          <Field label="Note" optional><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Scheduled days" error={errors.days} group>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map(day => {
                const on = form.scheduledDays.includes(day.value)
                return (
                  <button
                    key={day.value} type="button" aria-pressed={on}
                    onClick={() => setForm({ ...form, scheduledDays: on ? form.scheduledDays.filter(v => v !== day.value) : [...form.scheduledDays, day.value] })}
                    className={cn('h-8 rounded-md border px-2.5 text-[13px] font-medium', on ? 'border-accent bg-accent-soft text-text' : 'border-line-strong text-muted hover:text-text')}
                  >{day.label}</button>
                )
              })}
            </div>
          </Field>
          <Field label="Color" group><ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} /></Field>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button variant="primary" type="submit">{editing ? 'Save changes' : 'Create habit'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)} title="Delete this habit?"
        description={deleting ? `“${deleting.title}” and its ${deleting.logs.length} logged days will be removed.` : ''}
        confirmLabel="Delete habit" destructive onCancel={() => setDeleting(null)}
        onConfirm={() => { deleteHabit(deleting.id); setDeleting(null); toast.success('Habit deleted') }}
      />
    </div>
  )
}
