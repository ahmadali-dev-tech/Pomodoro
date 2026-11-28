import { Volume2 } from 'lucide-react'
import { SOUNDS } from '@/constants'
import { useSoundStore } from '@/stores/soundStore'
import { cn } from '@/lib/utils'

/** Sound chips and volume. State lives in soundStore, so sound keeps playing across pages. */
export default function AmbientSound() {
  const active = useSoundStore(s => s.active)
  const volume = useSoundStore(s => s.volume)
  const error = useSoundStore(s => s.error)
  const toggle = useSoundStore(s => s.toggle)
  const setVolume = useSoundStore(s => s.setVolume)

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Ambient sound">
        {SOUNDS.map(({ id, name, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={active === id}
            onClick={() => toggle(id)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[13px] font-medium transition-colors',
              active === id ? 'border-accent bg-accent-soft text-text' : 'border-line-strong text-muted hover:bg-raised hover:text-text',
            )}
          >
            <Icon size={14} aria-hidden="true" />
            {name}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Volume2 size={15} className="shrink-0 text-faint" aria-hidden="true" />
        <input
          type="range" min={0} max={100} value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          aria-label="Ambient sound volume"
          className="min-w-0 flex-1"
        />
        <span className="tnum w-9 text-right text-xs text-muted">{volume}%</span>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  )
}
