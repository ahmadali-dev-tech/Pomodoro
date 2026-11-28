import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/Field'

/** One-line task entry. Enter adds the task and keeps focus so several can be added in a row. */
export default function QuickAdd({ onAdd, placeholder = 'Add a task and press Enter', label = 'New task title' }) {
  const [title, setTitle] = useState('')
  const submit = (event) => {
    event.preventDefault()
    const value = title.trim()
    if (!value) return
    onAdd(value)
    setTitle('')
  }
  return (
    <form onSubmit={submit} className="relative">
      <Plus size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        maxLength={200}
        autoComplete="off"
        className="pl-9"
      />
    </form>
  )
}
