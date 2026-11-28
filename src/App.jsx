import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import Logo from '@/components/layout/Logo'
import Dashboard from '@/pages/Dashboard'
import Focus from '@/pages/Focus'
import Tasks from '@/pages/Tasks'
import Projects from '@/pages/Projects'
import ProjectDetails from '@/pages/ProjectDetails'
import Analytics from '@/pages/Analytics'
import Goals from '@/pages/Goals'
import Habits from '@/pages/Habits'
import FocusSounds from '@/pages/FocusSounds'
import Inbox from '@/pages/Inbox'
import Settings from '@/pages/Settings'
import Upgrade from '@/pages/Upgrade'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Calendar from '@/pages/Calendar'
import { useUIStore, normalizePreset } from '@/stores/uiStore'
import { useTimer } from '@/hooks/useTimer'
import { useResolvedTheme } from '@/hooks/useResolvedTheme'
import { useAuthStore } from '@/stores/authStore'
import { useSupabaseSync } from '@/hooks/useSupabaseSync'
import { useTaskStore } from '@/stores/taskStore'
import { useProjectStore } from '@/stores/projectStore'
import { useHabitStore } from '@/stores/habitStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { readableOn } from '@/lib/color'

function TimerRoot() {
  useTimer()
  return null
}

function ProtectedLayout({ user }) {
  if (!user) return <Navigate to="/login" replace />
  return <MainLayout />
}

/** One-time removal of the demo records that early versions of the app seeded. */
const SEED_CLEANUP_KEY = 'pomodoro-seed-cleanup-v1'
function removeLegacySeedData() {
  try {
    if (localStorage.getItem(SEED_CLEANUP_KEY)) return
    const projects = useProjectStore.getState()
    useProjectStore.setState({ projects: projects.projects.filter(p => !['p1', 'p2', 'p3'].includes(p.id)) })
    const tasks = useTaskStore.getState()
    useTaskStore.setState({
      tasks: tasks.tasks.filter(t => !['t1', 't2', 't3', 't4', 't5', 't6', 't7'].includes(t.id)),
      sessions: tasks.sessions.filter(s => !/^s\d+$/.test(String(s.id))),
    })
    const habits = useHabitStore.getState()
    useHabitStore.setState({ habits: habits.habits.filter(h => !['h1', 'h2', 'h3'].includes(h.id)) })
    const notifications = useNotificationStore.getState()
    useNotificationStore.setState({ items: notifications.items.filter(n => !['n1', 'n2', 'n3', 'n4'].includes(n.id)) })
    localStorage.setItem(SEED_CLEANUP_KEY, '1')
  } catch { /* storage unavailable: nothing to clean */ }
}

export default function App() {
  const themePreset = useUIStore(s => s.themePreset)
  const customAccent = useUIStore(s => s.customAccent)
  const resolvedTheme = useResolvedTheme()
  const initialize = useAuthStore(s => s.initialize)
  const initialized = useAuthStore(s => s.initialized)
  const user = useAuthStore(s => s.user)
  useSupabaseSync()

  useEffect(() => {
    if (!initialized) initialize()
  }, [initialize, initialized])

  useEffect(removeLegacySeedData, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(resolvedTheme)
    root.dataset.preset = normalizePreset(themePreset)
    // A custom accent replaces the preset accent; pick readable text for it.
    if (customAccent) {
      root.style.setProperty('--accent', customAccent)
      root.style.setProperty('--accent-fg', readableOn(customAccent))
    } else {
      root.style.removeProperty('--accent')
      root.style.removeProperty('--accent-fg')
    }
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim() || '#14181D')
  }, [resolvedTheme, themePreset, customAccent])

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg" role="status" aria-label="Loading">
        <Logo size={36} />
      </div>
    )
  }

  return (
    <>
      <TimerRoot />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
        <Route element={<ProtectedLayout user={user} />}>
          <Route index element={<Dashboard />} />
          <Route path="/focus" element={<Focus />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<ProjectDetails />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/sounds" element={<FocusSounds />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/upgrade" element={<Upgrade />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
