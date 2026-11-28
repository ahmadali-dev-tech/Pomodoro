import { Link, useLocation } from 'react-router-dom'
import { Pause, Play } from 'lucide-react'
import { useTimerStore } from '@/stores/timerStore'
import { formatTime } from '@/lib/utils'
import { MODE_LABELS } from '@/constants'

/** Shows the running timer in the header on every page except Focus. */
export default function MiniTimer() {
  const { pathname } = useLocation()
  const status = useTimerStore(s => s.status)
  const mode = useTimerStore(s => s.mode)
  const remaining = useTimerStore(s => s.remainingSeconds)
  const pause = useTimerStore(s => s.pause)
  const resume = useTimerStore(s => s.resume)

  if (status === 'idle' || pathname === '/focus') return null
  const running = status === 'running'

  return (
    <div className="flex items-center rounded-md border border-line bg-surface">
      <Link to="/focus" className="flex items-center gap-2 py-1 pl-2.5 pr-1.5 text-[13px] hover:text-accent" aria-label={`${MODE_LABELS[mode]} timer, ${formatTime(remaining)} left. Open focus.`}>
        <span className={running ? 'h-2 w-2 rounded-full bg-accent' : 'h-2 w-2 rounded-full bg-faint'} aria-hidden="true" />
        <span className="tnum font-semibold text-text">{formatTime(remaining)}</span>
        <span className="hidden text-muted lg:inline">{MODE_LABELS[mode]}</span>
      </Link>
      <button
        type="button"
        onClick={running ? pause : resume}
        aria-label={running ? 'Pause timer' : 'Resume timer'}
        className="mr-0.5 rounded p-1.5 text-muted hover:bg-raised hover:text-text"
      >
        {running ? <Pause size={14} /> : <Play size={14} />}
      </button>
    </div>
  )
}
