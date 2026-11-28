import { useMemo, useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { useTimerStore } from '@/stores/timerStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { formatTime } from '@/lib/utils'
import { MODE_LABELS } from '@/constants'

const DURATION_KEY = { focus: 'focusDuration', short_break: 'shortBreakDuration', long_break: 'longBreakDuration' }
const LIMITS = { focus: [1, 180], short_break: [1, 60], long_break: [1, 120] }

/** A kitchen-timer dial: a minute bezel, an arc for the time left, large tabular digits. */
export default function CircularTimer({ size = 320 }) {
  const remaining = useTimerStore(s => s.remainingSeconds)
  const duration = useTimerStore(s => s.durationSeconds)
  const mode = useTimerStore(s => s.mode)
  const status = useTimerStore(s => s.status)
  const reset = useTimerStore(s => s.reset)
  const settings = useSettingsStore()
  const [open, setOpen] = useState(false)
  const [minutes, setMinutes] = useState('')
  const [error, setError] = useState('')

  const key = DURATION_KEY[mode]
  const [min, max] = LIMITS[mode]
  const accent = mode === 'focus' ? 'var(--accent)' : 'var(--success)'

  const radius = 150
  const circumference = 2 * Math.PI * radius
  const fraction = Math.max(0, Math.min(1, remaining / (duration || 1)))

  const ticks = useMemo(() => Array.from({ length: 60 }, (_, i) => {
    const angle = (i / 60) * Math.PI * 2
    const major = i % 5 === 0
    const outer = 192
    const inner = major ? 176 : 183
    return { i, major, x1: 200 + Math.sin(angle) * inner, y1: 200 - Math.cos(angle) * inner, x2: 200 + Math.sin(angle) * outer, y2: 200 - Math.cos(angle) * outer }
  }), [])

  const openDialog = () => { setMinutes(String(settings[key])); setError(''); setOpen(true) }
  const save = (event) => {
    event.preventDefault()
    const value = Number(minutes)
    if (!Number.isInteger(value) || value < min || value > max) {
      setError(`Enter a whole number of minutes from ${min} to ${max}.`)
      return
    }
    settings.update({ [key]: value })
    reset()
    setOpen(false)
  }

  const label = MODE_LABELS[mode]
  const state = status === 'running' ? (mode === 'focus' ? 'Focusing' : 'On break') : status === 'paused' ? 'Paused' : 'Ready'

  return (
    <>
      <div className="relative mx-auto" style={{ width: size, height: size }} role="timer" aria-label={`${label}, ${formatTime(remaining)} remaining`}>
        <svg viewBox="0 0 400 400" width={size} height={size} aria-hidden="true">
          {ticks.map(t => (
            <line key={t.i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={t.major ? 'var(--muted)' : 'var(--line-strong)'} strokeWidth={t.major ? 3 : 2} strokeLinecap="round" />
          ))}
          <circle cx="200" cy="200" r={radius} fill="none" stroke="var(--line)" strokeWidth="10" />
          <circle
            cx="200" cy="200" r={radius} fill="none"
            stroke={accent} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - fraction)}
            transform="rotate(-90 200 200)"
            style={{ transition: 'stroke-dashoffset .3s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-display tnum font-semibold leading-none tracking-tight text-text" style={{ fontSize: size * 0.21 }}>
            {formatTime(remaining)}
          </div>
          <div className="mt-2 text-sm font-medium text-muted" style={{ fontSize: Math.max(12, size * 0.04) }}>
            {label} · {state}
          </div>
          <button
            type="button"
            onClick={openDialog}
            className="mt-1 rounded px-1.5 py-0.5 text-xs text-faint underline decoration-line-strong underline-offset-4 hover:text-text"
            style={{ fontSize: Math.max(11, size * 0.034) }}
          >
            {settings[key]} min · change
          </button>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`${label} length`}
        size="sm"
      >
        <form onSubmit={save} noValidate className="space-y-4">
          <Field
            label="Minutes"
            error={error}
            hint={status !== 'idle' ? 'Saving restarts the current timer. Time spent so far won’t be logged.' : `Between ${min} and ${max} minutes.`}
          >
            <Input type="number" inputMode="numeric" min={min} max={max} value={minutes} onChange={(e) => { setMinutes(e.target.value); setError('') }} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
