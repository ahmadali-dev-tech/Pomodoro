import { useEffect } from 'react'
import CircularTimer from '@/components/timer/CircularTimer'
import TimerControls from '@/components/timer/TimerControls'
import TaskSelector from '@/components/timer/TaskSelector'
import AmbientSound from '@/components/timer/AmbientSound'
import { Segmented } from '@/components/ui/Tabs'
import { useTimerStore } from '@/stores/timerStore'
import { useTaskStore } from '@/stores/taskStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

const MODES = [
  { value: 'focus', label: 'Focus' },
  { value: 'short_break', label: 'Short break' },
  { value: 'long_break', label: 'Long break' },
]

export default function Focus() {
  const mode = useTimerStore(s => s.mode)
  const setMode = useTimerStore(s => s.setMode)
  const status = useTimerStore(s => s.status)
  const taskId = useTimerStore(s => s.taskId)
  const completed = useTimerStore(s => s.completedFocusCount)
  const interval = useSettingsStore(s => s.longBreakInterval)
  const task = useTaskStore(s => s.tasks.find(t => t.id === taskId))
  const wide = useMediaQuery('(min-width: 640px)')

  // Space starts, pauses or resumes, unless the person is typing or focused on a control.
  useEffect(() => {
    const onKey = (event) => {
      if (event.code !== 'Space' || event.repeat || event.defaultPrevented) return
      if (event.target.closest?.('input, textarea, select, button, a, [role="dialog"], [contenteditable="true"]')) return
      event.preventDefault()
      const { status: s, start, pause, resume } = useTimerStore.getState()
      if (s === 'running') pause(); else if (s === 'paused') resume(); else start()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const dots = Math.min(Math.max(interval || 4, 2), 8)
  const filled = mode === 'long_break' && completed > 0 ? dots : completed % dots

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col items-center px-4 py-6 md:py-10">
      <h1 className="sr-only">Focus timer</h1>
      <Segmented label="Timer mode" value={mode} onChange={setMode} options={MODES} />

      <div className="mt-8 w-full">
        <CircularTimer size={wide ? 360 : 292} />
      </div>

      <div className="mt-8 w-full"><TimerControls /></div>
      <p className="mt-3 hidden text-xs text-faint sm:block">Press <kbd className="rounded border border-line px-1.5">Space</kbd> to {status === 'running' ? 'pause' : status === 'paused' ? 'resume' : 'start'}</p>

      <div className="mt-7 flex items-center gap-2.5" aria-label={`${filled} of ${dots} focus sessions done before the long break`} role="img">
        {Array.from({ length: dots }).map((_, i) => (
          <span key={i} className={cn('h-2.5 w-2.5 rounded-full', i < filled ? 'bg-accent' : 'bg-line-strong')} />
        ))}
      </div>
      <p className="mt-2 text-xs text-muted tnum">{filled} of {dots} sessions before a long break</p>

      <div className="panel mt-8 w-full divide-line">
        <div className="p-4">
          <TaskSelector />
          {task && (
            <p className="tnum mt-2 text-xs text-muted">
              {task.actualPomodoros || 0} of {task.estimatedPomodoros || 1} planned {(task.estimatedPomodoros || 1) === 1 ? 'session' : 'sessions'} done
            </p>
          )}
        </div>
        <div className="p-4">
          <h2 className="mb-3 text-[13px] font-medium">Ambient sound</h2>
          <AmbientSound />
        </div>
      </div>
    </div>
  )
}
