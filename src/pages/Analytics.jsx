import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import PageHeader from '@/components/ui/PageHeader'
import ProgressBar from '@/components/ui/ProgressBar'
import { Segmented } from '@/components/ui/Tabs'
import { useTaskStore } from '@/stores/taskStore'
import { useProjectStore } from '@/stores/projectStore'
import { dateKey, formatMinutes, isOverdue } from '@/lib/utils'

const RANGES = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '0', label: 'All time' },
]
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const minutesFor = (s) => Math.max(0, Number(s.actualDurationSeconds ?? s.plannedDurationSeconds ?? 0) / 60)
const axisMinutes = (v) => (v >= 60 ? `${Math.round(v / 60)}h` : `${v}m`)
const tooltipStyle = { background: 'var(--surface)', border: '1px solid var(--line-strong)', borderRadius: 8, color: 'var(--text)', fontSize: 13 }

function Panel({ title, note, children, className = '' }) {
  return (
    <section className={`panel p-4 ${className}`}>
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Bars({ data, xKey, color = 'var(--accent)', height = 220, interval = 0 }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey={xKey} stroke="var(--muted)" fontSize={11} axisLine={false} tickLine={false} interval={interval} />
          <YAxis stroke="var(--muted)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={axisMinutes} allowDecimals={false} />
          <Tooltip cursor={{ fill: 'var(--raised)' }} contentStyle={tooltipStyle} labelStyle={{ color: 'var(--muted)' }} formatter={(v) => [formatMinutes(v), 'Focus time']} />
          <Bar dataKey="minutes" fill={color} radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Analytics() {
  const allSessions = useTaskStore(s => s.sessions)
  const tasks = useTaskStore(s => s.tasks)
  const projects = useProjectStore(s => s.projects)
  const [range, setRange] = useState('7')
  const days = Number(range)

  const focus = useMemo(() => (Array.isArray(allSessions) ? allSessions : [])
    .filter(s => s.sessionType === 'focus' && (!s.status || s.status === 'completed'))
    .map(s => ({ ...s, date: new Date(s.endedAt ?? s.createdAt ?? s.startedAt), minutes: minutesFor(s) }))
    .filter(s => !Number.isNaN(s.date.getTime()) && s.minutes > 0), [allSessions])

  const start = useMemo(() => {
    if (!days) return null
    const d = startOfDay(new Date())
    d.setDate(d.getDate() - (days - 1))
    return d
  }, [days])

  const inRange = useMemo(() => focus.filter(s => !start || s.date >= start), [focus, start])
  const previous = useMemo(() => {
    if (!start) return []
    const prevStart = new Date(start)
    prevStart.setDate(prevStart.getDate() - days)
    return focus.filter(s => s.date >= prevStart && s.date < start)
  }, [focus, start, days])

  const total = inRange.reduce((n, s) => n + s.minutes, 0)
  const prevTotal = previous.reduce((n, s) => n + s.minutes, 0)
  const activeDays = new Set(inRange.map(s => dateKey(s.date))).size
  const completedInRange = tasks.filter(t => t.status === 'completed' && t.completedAt && (!start || new Date(t.completedAt) >= start)).length
  const change = days && prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null

  const daily = useMemo(() => {
    const n = days || 90
    const first = start || (() => { const d = startOfDay(new Date()); d.setDate(d.getDate() - n + 1); return d })()
    const byDay = new Map()
    inRange.forEach(s => byDay.set(dateKey(s.date), (byDay.get(dateKey(s.date)) || 0) + s.minutes))
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(first); d.setDate(first.getDate() + i)
      return { key: dateKey(d), label: n <= 7 ? d.toLocaleDateString('en-US', { weekday: 'short' }) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), minutes: Math.round(byDay.get(dateKey(d)) || 0) }
    })
  }, [inRange, days, start])

  const byProject = useMemo(() => projects
    .map(p => ({ id: p.id, name: p.name || 'Untitled', color: p.color, minutes: Math.round(inRange.filter(s => s.projectId === p.id).reduce((n, s) => n + s.minutes, 0)) }))
    .filter(p => p.minutes > 0).sort((a, b) => b.minutes - a.minutes), [projects, inRange])

  const weekday = useMemo(() => DAY_NAMES.map((day, i) => ({ day, minutes: Math.round(inRange.filter(s => s.date.getDay() === i).reduce((n, s) => n + s.minutes, 0)) })), [inRange])
  const hourly = useMemo(() => Array.from({ length: 24 }, (_, h) => ({ hour: h, label: `${h % 12 || 12}${h < 12 ? 'a' : 'p'}`, minutes: Math.round(inRange.filter(s => s.date.getHours() === h).reduce((n, s) => n + s.minutes, 0)) })), [inRange])
  const peakHour = [...hourly].sort((a, b) => b.minutes - a.minutes)[0]
  const bestDay = [...weekday].sort((a, b) => b.minutes - a.minutes)[0]

  const taskStats = useMemo(() => ({
    total: tasks.length,
    done: tasks.filter(t => t.status === 'completed').length,
    open: tasks.filter(t => t.status !== 'completed' && t.status !== 'archived').length,
    overdue: tasks.filter(isOverdue).length,
  }), [tasks])

  const heat = useMemo(() => {
    const counts = new Map()
    focus.forEach(s => counts.set(dateKey(s.date), (counts.get(dateKey(s.date)) || 0) + s.minutes))
    const end = startOfDay(new Date())
    const first = new Date(end); first.setDate(first.getDate() - 83); first.setDate(first.getDate() - ((first.getDay() + 6) % 7))
    const cells = []
    for (let d = new Date(first); d <= end; d.setDate(d.getDate() + 1)) cells.push({ key: dateKey(d), date: new Date(d), minutes: counts.get(dateKey(d)) || 0 })
    return cells
  }, [focus])
  const heatColor = (m) => (!m ? 'var(--raised)' : `color-mix(in srgb, var(--accent) ${m < 30 ? 30 : m < 60 ? 50 : m < 120 ? 75 : 100}%, var(--surface))`)

  if (focus.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[1000px] px-4 py-6 md:px-8 md:py-8">
        <PageHeader title="Analytics" />
        <div className="panel">
          <EmptyState icon={BarChart3} title="No focus sessions yet" description="Complete a focus session and your totals, best days and time-of-day patterns will appear here." action={<Link to="/focus"><Button variant="primary">Start a focus session</Button></Link>} />
        </div>
      </div>
    )
  }

  const noData = inRange.length === 0
  const summary = [
    { label: 'Focus time', value: formatMinutes(Math.round(total)), sub: change === null ? null : `${change >= 0 ? '+' : ''}${change}% vs previous ${days} days` },
    { label: 'Sessions', value: inRange.length, sub: activeDays ? `${activeDays} active ${activeDays === 1 ? 'day' : 'days'}` : null },
    { label: 'Average session', value: inRange.length ? `${Math.round(total / inRange.length)}m` : '–', sub: null },
    { label: 'Tasks completed', value: completedInRange, sub: null },
  ]

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-6 md:px-8 md:py-8">
      <PageHeader title="Analytics" description="Calculated from your logged focus sessions and tasks." actions={<Segmented label="Date range" value={range} onChange={setRange} options={RANGES} size="sm" />} />

      <dl className="panel grid grid-cols-2 divide-line md:grid-cols-4 [&>div]:p-4 [&>div]:border-line max-md:[&>div:nth-child(n+3)]:border-t max-md:[&>div:nth-child(even)]:border-l md:[&>div:not(:first-child)]:border-l">
        {summary.map(item => (
          <div key={item.label}>
            <dt className="text-xs text-muted">{item.label}</dt>
            <dd className="font-display tnum mt-1 text-[26px] font-semibold leading-none tracking-tight">{item.value}</dd>
            {item.sub && <dd className="mt-1.5 text-xs text-muted">{item.sub}</dd>}
          </div>
        ))}
      </dl>

      {noData && <p className="mt-4 text-[13px] text-muted">No focus sessions in this period. Choose a longer range to see earlier activity.</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Focus time per day" note={days ? `Last ${days} days` : 'Most recent 90 days'} className="lg:col-span-2">
          <Bars data={daily} xKey="label" height={240} interval={daily.length > 31 ? Math.ceil(daily.length / 10) : daily.length > 7 ? 2 : 0} />
        </Panel>

        <Panel title="By project" note="Focus time on tasks that belong to a project">
          {byProject.length === 0 ? <p className="py-6 text-[13px] text-muted">No sessions on project tasks in this period.</p> : (
            <ul className="space-y-3">
              {byProject.slice(0, 8).map(p => (
                <li key={p.id}>
                  <div className="mb-1 flex justify-between text-[13px]"><span className="truncate pr-3">{p.name}</span><span className="tnum shrink-0 text-muted">{formatMinutes(p.minutes)}</span></div>
                  <ProgressBar value={p.minutes} max={byProject[0].minutes} color={p.color} label={p.name} height={6} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Tasks" note="Current workload">
          <ul className="space-y-3">
            {[{ label: 'Completed', v: taskStats.done, c: 'var(--success)' }, { label: 'Open', v: taskStats.open, c: 'var(--accent)' }, { label: 'Overdue', v: taskStats.overdue, c: 'var(--danger)' }].map(r => (
              <li key={r.label}>
                <div className="mb-1 flex justify-between text-[13px]"><span>{r.label}</span><span className="tnum text-muted">{r.v}</span></div>
                <ProgressBar value={r.v} max={taskStats.total || 1} color={r.c} label={r.label} height={6} />
              </li>
            ))}
          </ul>
          {taskStats.total === 0 && <p className="mt-3 text-[13px] text-muted">No tasks yet.</p>}
        </Panel>

        <Panel title="Day of week" note={!noData && bestDay?.minutes ? `Most focus on ${bestDay.day}` : undefined}>
          <Bars data={weekday} xKey="day" color="var(--muted)" height={190} />
        </Panel>

        <Panel title="Time of day" note={!noData && peakHour?.minutes ? `Peak hour: ${peakHour.hour % 12 || 12}:00 ${peakHour.hour < 12 ? 'AM' : 'PM'}` : undefined}>
          <Bars data={hourly} xKey="label" color="var(--muted)" height={190} interval={2} />
        </Panel>

        <Panel title="Last 12 weeks" note="One square per day. Darker means more focus time." className="lg:col-span-2">
          <div className="overflow-x-auto pb-1">
            <div className="flex min-w-[560px] gap-1" role="img" aria-label="Focus activity heatmap for the last 12 weeks">
              {Array.from({ length: Math.ceil(heat.length / 7) }, (_, w) => (
                <div key={w} className="flex flex-1 flex-col gap-1">
                  {heat.slice(w * 7, w * 7 + 7).map(c => (
                    <div key={c.key} className="aspect-square w-full max-w-4 rounded-[3px] border border-line" style={{ background: heatColor(c.minutes) }} title={`${c.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${c.minutes ? formatMinutes(Math.round(c.minutes)) : 'no focus'}`} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}
