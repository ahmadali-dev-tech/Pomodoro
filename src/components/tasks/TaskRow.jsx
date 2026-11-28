import { Play, Trash2 } from 'lucide-react'
import Checkbox from '@/components/ui/Checkbox'
import PriorityBadge from '@/components/ui/PriorityBadge'
import { cn, formatDue, isOverdue, dueKey, todayISO } from '@/lib/utils'

/**
 * One task in a list. Title opens the editor; the checkbox completes; the play button
 * sends the task to the Focus timer. Secondary actions appear on hover/focus on desktop
 * and stay visible on touch screens.
 */
export default function TaskRow({ task, project, onToggle, onEdit, onDelete, onFocus, showProject = true, readOnly = false }) {
  const done = task.status === 'completed'
  const overdue = isOverdue(task)
  const dueToday = dueKey(task.dueDate) === todayISO()
  const sessions = task.estimatedPomodoros ? `${task.actualPomodoros || 0} of ${task.estimatedPomodoros} ${task.estimatedPomodoros === 1 ? 'session' : 'sessions'}` : null

  return (
    <div className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-raised/60">
      <Checkbox
        className="mt-0.5"
        checked={done}
        disabled={readOnly}
        onChange={() => onToggle?.(task)}
        label={done ? `Reopen “${task.title}”` : `Complete “${task.title}”`}
      />

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onEdit?.(task)}
          disabled={readOnly}
          className={cn('block max-w-full truncate text-left text-sm font-medium', done ? 'text-muted line-through decoration-line-strong' : 'text-text hover:text-accent')}
        >
          {task.title}
        </button>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
          {showProject && project && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: project.color }} aria-hidden="true" />
              {project.name}
            </span>
          )}
          {task.dueDate && !done && (
            <span className={cn(overdue && 'font-medium text-danger', dueToday && 'font-medium text-text')}>
              {overdue ? 'Overdue · ' : ''}{formatDue(task.dueDate)}
            </span>
          )}
          {task.dueDate && done && <span>Due {formatDue(task.dueDate)}</span>}
          {sessions && !done && <span className="tnum">{sessions}</span>}
        </div>
      </div>

      <PriorityBadge priority={task.priority} className="mt-1 shrink-0" />

      {!readOnly && (
        <div className="-my-1 flex shrink-0 items-center md:opacity-0 md:transition-opacity md:group-focus-within:opacity-100 md:group-hover:opacity-100">
          {!done && onFocus && (
            <button
              type="button"
              onClick={() => onFocus(task)}
              aria-label={`Start a focus session on “${task.title}”`}
              title="Start focus session"
              className="rounded-md p-1.5 text-muted hover:bg-raised hover:text-accent"
            >
              <Play size={15} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(task)}
              aria-label={`Delete “${task.title}”`}
              title="Delete task"
              className="rounded-md p-1.5 text-muted hover:bg-danger-soft hover:text-danger"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
