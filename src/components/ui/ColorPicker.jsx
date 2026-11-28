import { cn } from '@/lib/utils'

const COLORS = ['#E5573A', '#E59A3A', '#C9A227', '#3FA876', '#2FA3A3', '#3D8BD6', '#7C6BD6', '#C45C93', '#7C8794']

export default function ColorPicker({ value, onChange }) {
  const current = (value || '').toLowerCase()
  return (
    <div className="flex flex-wrap items-center gap-2">
      {COLORS.map((color) => {
        const selected = current === color.toLowerCase()
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={`Color ${color}`}
            aria-pressed={selected}
            className={cn('h-6 w-6 rounded-full ring-offset-2 ring-offset-surface transition', selected ? 'ring-2 ring-text' : 'hover:ring-2 hover:ring-line-strong')}
            style={{ background: color }}
          />
        )
      })}
      <label className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-full border border-line-strong" title="Custom color">
        <span className="absolute inset-0" style={{ background: 'conic-gradient(#E5573A, #E59A3A, #3FA876, #3D8BD6, #7C6BD6, #E5573A)' }} />
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value || '') ? value : '#E5573A'}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Custom color"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
    </div>
  )
}
