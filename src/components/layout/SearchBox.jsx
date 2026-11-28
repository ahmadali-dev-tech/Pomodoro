import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, ListChecks, Search, X } from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import { useProjectStore } from '@/stores/projectStore'
import { cn, formatDue, isOverdue } from '@/lib/utils'

/** Header search across tasks and projects. Arrow keys + Enter, Escape to close, "/" or Ctrl/⌘K to focus. */
export default function SearchBox() {
  const navigate = useNavigate()
  const tasks = useTaskStore(s => s.tasks)
  const projects = useProjectStore(s => s.projects)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const inputRef = useRef(null)
  const rootRef = useRef(null)
  const listId = useId()

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return []
    const projectHits = projects
      .filter(p => (p.name || '').toLowerCase().includes(needle))
      .slice(0, 4)
      .map(p => ({ key: `p-${p.id}`, kind: 'project', title: p.name, meta: 'Project', to: `/projects/${p.id}` }))
    const taskHits = tasks
      .filter(t => (t.title || '').toLowerCase().includes(needle))
      .sort((a, b) => Number(a.status === 'completed') - Number(b.status === 'completed'))
      .slice(0, 6)
      .map(t => ({
        key: `t-${t.id}`,
        kind: 'task',
        title: t.title,
        meta: t.status === 'completed' ? 'Completed' : t.dueDate ? `${isOverdue(t) ? 'Overdue · ' : 'Due '}${formatDue(t.dueDate)}` : 'No due date',
        to: `/tasks?task=${t.id}`,
      }))
    return [...projectHits, ...taskHits]
  }, [query, tasks, projects])

  useEffect(() => { setActive(0) }, [query])

  useEffect(() => {
    const onKey = (event) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) || event.target.isContentEditable
      if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typing)) {
        event.preventDefault()
        setMobileOpen(true)
        setOpen(true)
        window.setTimeout(() => inputRef.current?.focus(), 0)
      }
    }
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) { setOpen(false); setMobileOpen(false) }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [])

  const choose = (result) => {
    if (!result) return
    navigate(result.to)
    setQuery('')
    setOpen(false)
    setMobileOpen(false)
    inputRef.current?.blur()
  }

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActive(i => Math.min(i + 1, results.length - 1)) }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
    else if (event.key === 'Enter') { event.preventDefault(); choose(results[active]) }
    else if (event.key === 'Escape') { setOpen(false); setMobileOpen(false); inputRef.current?.blur() }
  }

  const showList = open && query.trim().length > 0

  return (
    <div ref={rootRef} className="contents">
      <button
        type="button"
        aria-label="Search tasks and projects"
        onClick={() => { setMobileOpen(true); setOpen(true); window.setTimeout(() => inputRef.current?.focus(), 0) }}
        className="rounded-md p-2 text-muted hover:bg-raised hover:text-text sm:hidden"
      >
        <Search size={18} />
      </button>

      <div className={cn(
        mobileOpen ? 'fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 border-b border-line bg-bg px-3 sm:static sm:z-auto sm:h-auto sm:border-0 sm:bg-transparent sm:px-0' : 'hidden sm:block',
        'sm:relative sm:w-full sm:max-w-sm',
      )}>
        <div className="relative w-full">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-label="Search tasks and projects"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
            value={query}
            onChange={(event) => { setQuery(event.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Search tasks and projects"
            className="field field-sm pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button type="button" aria-label="Clear search" onClick={() => { setQuery(''); inputRef.current?.focus() }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-faint hover:text-text">
              <X size={14} />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-line px-1.5 text-[11px] text-faint md:block">/</kbd>
          )}
        </div>
        {mobileOpen && (
          <button type="button" onClick={() => setMobileOpen(false)} className="shrink-0 px-2 text-[13px] font-medium text-muted sm:hidden">Cancel</button>
        )}

        {showList && (
          <ul
            id={listId}
            role="listbox"
            aria-label="Search results"
            className="absolute left-3 right-3 top-[calc(100%-4px)] z-50 max-h-80 overflow-y-auto rounded-lg border border-line bg-surface py-1 shadow-pop sm:left-0 sm:right-0 sm:top-[calc(100%+6px)]"
          >
            {results.length === 0 ? (
              <li className="px-3 py-3 text-[13px] text-muted">No tasks or projects match “{query.trim()}”.</li>
            ) : results.map((result, index) => {
              const Icon = result.kind === 'project' ? FolderKanban : ListChecks
              return (
                <li
                  key={result.key}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={(event) => { event.preventDefault(); choose(result) }}
                  className={cn('flex cursor-pointer items-center gap-2.5 px-3 py-2', index === active && 'bg-raised')}
                >
                  <Icon size={15} className="shrink-0 text-faint" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-text">{result.title}</span>
                  <span className="shrink-0 text-xs text-muted">{result.meta}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
