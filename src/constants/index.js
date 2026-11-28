import {
  BarChart3, CalendarDays, Coffee, CloudRain, Flame, FolderKanban, Inbox, LayoutDashboard,
  ListChecks, Music2, Radio, Repeat, Settings, Target, Timer, Trees, Waves, Sparkles,
} from 'lucide-react'

export const PRIORITIES = ['low', 'medium', 'high', 'urgent']
export const PRIORITY_LEVEL = { low: 1, medium: 2, high: 3, urgent: 4 }
export const STATUSES = ['todo', 'in_progress', 'completed', 'archived']
export const TIMER_MODES = ['focus', 'short_break', 'long_break']

export const MODE_LABELS = { focus: 'Focus', short_break: 'Short break', long_break: 'Long break' }

export const SOUNDS = [
  { id: 'rain', name: 'Rain', icon: CloudRain },
  { id: 'forest', name: 'Forest', icon: Trees },
  { id: 'ocean', name: 'Ocean', icon: Waves },
  { id: 'white', name: 'White noise', icon: Radio },
  { id: 'fireplace', name: 'Fireplace', icon: Flame },
  { id: 'cafe', name: 'Café', icon: Coffee },
]

export const NAV_SECTIONS = [
  {
    title: 'Workspace',
    items: [
      { label: 'Overview', path: '/', icon: LayoutDashboard, end: true },
      { label: 'Focus', path: '/focus', icon: Timer },
      { label: 'Tasks', path: '/tasks', icon: ListChecks },
      { label: 'Projects', path: '/projects', icon: FolderKanban },
      { label: 'Calendar', path: '/calendar', icon: CalendarDays },
    ],
  },
  {
    title: 'Progress',
    items: [
      { label: 'Analytics', path: '/analytics', icon: BarChart3 },
      { label: 'Goals', path: '/goals', icon: Target },
      { label: 'Habits', path: '/habits', icon: Repeat },
    ],
  },
  {
    title: 'You',
    items: [
      { label: 'Sounds', path: '/sounds', icon: Music2 },
      { label: 'Inbox', path: '/inbox', icon: Inbox },
      { label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
]

export const UPGRADE_NAV = { label: 'Upgrade to Pro', path: '/upgrade', icon: Sparkles }
