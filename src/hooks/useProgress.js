import { useEffect, useMemo, useState } from 'react'
import { useTaskStore } from '@/stores/taskStore'
import { dateKey, isToday, startOfWeek, todayISO } from '@/lib/utils'

const minutesOf = (session) => (session.actualDurationSeconds || 0) / 60

/** The current local day, re-evaluated every minute so "today" rolls over while the app stays open. */
export function useToday() {
  const [day, setDay] = useState(todayISO)
  useEffect(() => {
    const id = window.setInterval(() => setDay(todayISO()), 60000)
    return () => window.clearInterval(id)
  }, [])
  return day
}

/** Real progress figures from sessions and tasks: today, and Monday–Sunday of this week. */
export function useProgress() {
  const tasks = useTaskStore(s => s.tasks)
  const sessions = useTaskStore(s => s.sessions)
  const day = useToday()

  return useMemo(() => {
    const focus = sessions.filter(s => s.sessionType === 'focus')
    const today = focus.filter(s => isToday(s.endedAt))
    const todayMinutes = Math.round(today.reduce((sum, s) => sum + minutesOf(s), 0))

    const monday = startOfWeek()
    const week = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      const inDay = focus.filter(s => isToday(s.endedAt, date))
      return {
        key: dateKey(date),
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: dateKey(date) === day,
        isFuture: dateKey(date) > day,
        minutes: Math.round(inDay.reduce((sum, s) => sum + minutesOf(s), 0)),
        sessions: inDay.length,
      }
    })

    const completedToday = tasks.filter(t => t.status === 'completed' && t.completedAt && isToday(t.completedAt))
    return {
      todayMinutes,
      todaySessions: today.length,
      completedToday,
      week,
      weekMinutes: week.reduce((sum, d) => sum + d.minutes, 0),
      recent: focus.slice(0, 5),
    }
  }, [tasks, sessions, day])
}
