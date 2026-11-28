import { useState } from 'react'
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useTimerStore } from '@/stores/timerStore'

export default function TimerControls({ size = 'lg', align = 'center' }) {
  const status = useTimerStore(s => s.status)
  const mode = useTimerStore(s => s.mode)
  const start = useTimerStore(s => s.start)
  const pause = useTimerStore(s => s.pause)
  const resume = useTimerStore(s => s.resume)
  const reset = useTimerStore(s => s.reset)
  const setMode = useTimerStore(s => s.setMode)
  const [confirm, setConfirm] = useState(null) // 'reset' | 'skip'

  const primary = status === 'running'
    ? { label: 'Pause', Icon: Pause, run: pause }
    : status === 'paused'
      ? { label: 'Resume', Icon: Play, run: resume }
      : { label: mode === 'focus' ? 'Start focus' : 'Start break', Icon: Play, run: start }

  const skipTarget = mode === 'focus' ? 'short_break' : 'focus'
  const inProgress = status !== 'idle'
  const ask = (kind, action) => (inProgress ? setConfirm(kind) : action())
  const doReset = () => { reset(); setConfirm(null) }
  const doSkip = () => { setMode(skipTarget); setConfirm(null) }

  return (
    <>
      <div className={`flex items-center gap-2 ${size === 'lg' ? 'flex-wrap' : ''} ${align === 'center' ? 'justify-center' : ''}`}>
        <Button variant="primary" size={size} onClick={primary.run} className={size === 'lg' ? 'min-w-[9.5rem]' : undefined}>
          <primary.Icon size={size === 'lg' ? 18 : 16} aria-hidden="true" />
          {primary.label}
        </Button>
        <Button variant="secondary" size={size === 'lg' ? 'lg' : size} onClick={() => ask('reset', doReset)} aria-label="Reset timer">
          <RotateCcw size={16} aria-hidden="true" />
          {size === 'lg' && <span className="hidden sm:inline">Reset</span>}
        </Button>
        <Button variant="secondary" size={size === 'lg' ? 'lg' : size} onClick={() => ask('skip', doSkip)} aria-label={mode === 'focus' ? 'Skip to break' : 'Skip to focus'}>
          <SkipForward size={16} aria-hidden="true" />
          {size === 'lg' && <span className="hidden sm:inline">Skip</span>}
        </Button>
      </div>

      <ConfirmDialog
        open={confirm === 'reset'}
        title="Reset the timer?"
        description="The current session will be discarded and won’t be logged."
        confirmLabel="Reset timer"
        destructive
        onConfirm={doReset}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'skip'}
        title={mode === 'focus' ? 'Skip to a break?' : 'Skip the break?'}
        description="The current session will end without being logged."
        confirmLabel={mode === 'focus' ? 'Skip to break' : 'Skip to focus'}
        destructive
        onConfirm={doSkip}
        onCancel={() => setConfirm(null)}
      />
    </>
  )
}
