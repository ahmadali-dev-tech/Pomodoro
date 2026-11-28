import { useEffect } from 'react'
import { useTimerStore } from '@/stores/timerStore'
import { formatTime } from '@/lib/utils'

const MODE_LABEL = { focus: 'Focus', short_break: 'Short break', long_break: 'Long break' }

export const useTimer = () => {
  const tick = useTimerStore(s => s.tick)
  const status = useTimerStore(s => s.status)
  const mode = useTimerStore(s => s.mode)
  const remaining = useTimerStore(s => s.remainingSeconds)

  useEffect(() => {
    if (status !== 'running') return
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [status, tick])

  // Keep the remaining time in the browser tab so it is visible from other tabs.
  useEffect(() => {
    document.title = status === 'idle'
      ? 'Pomodoro'
      : `${formatTime(remaining)} · ${MODE_LABEL[mode] || 'Focus'}${status === 'paused' ? ' (paused)' : ''}`
    return () => { document.title = 'Pomodoro' }
  }, [status, mode, remaining])
}
