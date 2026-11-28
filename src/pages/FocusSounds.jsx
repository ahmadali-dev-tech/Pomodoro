import { Pause, Play, VolumeX } from 'lucide-react'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/ui/PageHeader'
import { SOUNDS } from '@/constants'
import { useSoundStore } from '@/stores/soundStore'
import { cn } from '@/lib/utils'

export default function FocusSounds() {
  const active = useSoundStore(s => s.active)
  const volume = useSoundStore(s => s.volume)
  const error = useSoundStore(s => s.error)
  const toggle = useSoundStore(s => s.toggle)
  const stop = useSoundStore(s => s.stop)
  const setVolume = useSoundStore(s => s.setVolume)

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-6 md:px-8 md:py-8">
      <PageHeader title="Sounds" description="Background sound for focus. It keeps playing while you move between pages." actions={active && <Button size="sm" onClick={stop}><VolumeX size={15} aria-hidden="true" />Stop sound</Button>} />

      <ul className="panel divide-line overflow-hidden">
        {SOUNDS.map(({ id, name, icon: Icon }) => {
          const on = active === id
          return (
            <li key={id}>
              <button type="button" onClick={() => toggle(id)} aria-pressed={on} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-raised/60">
                <Icon size={18} className={cn(on ? 'text-accent' : 'text-faint')} aria-hidden="true" />
                <span className={cn('flex-1 text-sm', on ? 'font-medium text-text' : 'text-text')}>{name}</span>
                <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
                  {on ? <><Pause size={14} aria-hidden="true" />Playing</> : <><Play size={14} aria-hidden="true" />Play</>}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="panel mt-4 flex items-center gap-4 p-4">
        <label htmlFor="volume" className="text-[13px] font-medium">Volume</label>
        <input id="volume" type="range" min={0} max={100} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="min-w-0 flex-1" />
        <span className="tnum w-10 text-right text-xs text-muted">{volume}%</span>
      </div>
      {error && <p role="alert" className="mt-3 text-[13px] text-danger">{error}</p>}
    </div>
  )
}
