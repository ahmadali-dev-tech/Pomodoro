import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import ProgressBar from '@/components/ui/ProgressBar'
import { Input } from '@/components/ui/Field'
import { useGoalStore } from '@/stores/goalStore'
import { useProgress } from '@/hooks/useProgress'
import { formatMinutes } from '@/lib/utils'

function TargetInput({ label, value, unit, max, onCommit }) {
  const [text, setText] = useState(String(value))
  const [error, setError] = useState('')
  const commit = () => {
    const n = Number(text)
    if (!Number.isInteger(n) || n < 1 || n > max) {
      setError(`Whole number, 1 to ${max}`)
      return
    }
    setError('')
    if (n !== value) onCommit(n)
  }
  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`goal-${label}`}>{label} target</label>
        <Input
          id={`goal-${label}`} type="number" inputMode="numeric" min={1} max={max} value={text}
          onChange={(e) => { setText(e.target.value); setError('') }}
          onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          aria-invalid={error ? 'true' : undefined}
          className="field-sm tnum w-20 text-right"
        />
        <span className="w-8 text-xs text-muted">{unit}</span>
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}

export default function Goals() {
  const goals = useGoalStore(s => s.goals)
  const update = useGoalStore(s => s.update)
  const progress = useProgress()

  const rows = [
    { key: 'focusMinutes', label: 'Daily focus time', current: progress.todayMinutes, unit: 'min', max: 1440, note: 'Resets each day', show: (v) => formatMinutes(v) },
    { key: 'pomodoros', label: 'Daily focus sessions', current: progress.todaySessions, unit: '', max: 50, note: 'Resets each day', show: String },
    { key: 'tasks', label: 'Daily tasks completed', current: progress.completedToday.length, unit: '', max: 200, note: 'Resets each day', show: String },
    { key: 'weeklyMinutes', label: 'Weekly focus time', current: progress.weekMinutes, unit: 'min', max: 10080, note: 'Monday to Sunday', show: (v) => formatMinutes(v) },
  ]

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-6 md:px-8 md:py-8">
      <PageHeader title="Goals" description="Set daily and weekly targets. Progress is counted from your logged sessions and completed tasks." />
      <ul className="panel divide-line overflow-hidden">
        {rows.map(row => {
          const target = goals[row.key] || 1
          const reached = row.current >= target
          return (
            <li key={row.key} className="px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-text">{row.label}</div>
                  <div className="text-xs text-muted">{row.note}</div>
                </div>
                <TargetInput label={row.label} value={target} unit={row.unit} max={row.max} onCommit={(n) => update({ [row.key]: n })} />
              </div>
              <div className="mt-3">
                <ProgressBar value={row.current} max={target} label={row.label} color={reached ? 'var(--success)' : 'var(--accent)'} />
                <div className="tnum mt-1.5 flex justify-between text-xs text-muted">
                  <span>{row.show(row.current)} of {row.show(target)}</span>
                  <span>{reached ? 'Goal reached' : `${Math.round((row.current / target) * 100)}%`}</span>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
