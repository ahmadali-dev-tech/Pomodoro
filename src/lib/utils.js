export const cn = (...classes) => classes.filter(Boolean).join(' ')

export const formatTime = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export const formatMinutes = (mins) => {
  if (!mins) return '0m'
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const pad = (n) => String(n).padStart(2, '0')

/** Local calendar date as YYYY-MM-DD. */
export const dateKey = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

/** Today's local date as YYYY-MM-DD (habit logs and due-date comparisons use this). */
export const todayISO = () => dateKey(new Date())

/** Turn a YYYY-MM-DD key into a local Date at midnight. */
export const parseKey = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * The calendar day a task is due, as YYYY-MM-DD.
 * Due dates are stored as "YYYY-MM-DD" or "YYYY-MM-DDT00:00:00.000Z" and mean a calendar day,
 * not an instant, so the first ten characters are the day the person picked in every timezone.
 */
export const dueKey = (value) => {
  if (!value) return null
  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10)
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : dateKey(date)
}

/** Value to store for a date input (keeps the existing storage format). */
export const dueToStored = (inputValue) => (inputValue ? new Date(inputValue).toISOString() : null)

export const isDueToday = (value) => dueKey(value) === todayISO()

export const isOpenTask = (task) => task.status !== 'completed' && task.status !== 'archived'

export const isOverdue = (task) => {
  const key = dueKey(task.dueDate)
  return Boolean(key) && isOpenTask(task) && key < todayISO()
}

export const daysFromToday = (key) =>
  Math.round((parseKey(key) - parseKey(todayISO())) / 86400000)

/** Human label for a due date: Today, Tomorrow, Yesterday, a weekday within the week, else "Nov 3". */
export const formatDue = (value) => {
  const key = dueKey(value)
  if (!key) return ''
  const diff = daysFromToday(key)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  const date = parseKey(key)
  if (diff > 1 && diff < 7) return date.toLocaleDateString('en-US', { weekday: 'long' })
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleDateString('en-US', sameYear
    ? { month: 'short', day: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Date + weekday for a heading, from a YYYY-MM-DD key. */
export const formatDayHeading = (key) =>
  parseKey(key).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

/** For timestamps (Date.now() values), not due dates. */
export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export const formatTimeOfDay = (date) =>
  new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

/** True when a timestamp falls on the local calendar day of `reference` (default today). */
export const isToday = (value, reference = new Date()) => {
  if (value == null || value === '') return false
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return false
  return d.getFullYear() === reference.getFullYear() &&
    d.getMonth() === reference.getMonth() &&
    d.getDate() === reference.getDate()
}

export const startOfWeek = (date = new Date()) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

export const uid = () =>
  'id_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export const greetingFor = (date = new Date()) => {
  const hour = date.getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}
