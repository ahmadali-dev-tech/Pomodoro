import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useGoalStore = create(persist(
  (set) => ({
    goals: {
      focusMinutes: 120,
      pomodoros: 6,
      tasks: 5,
      weeklyMinutes: 600,
    },
    update: (patch) => set((s) => ({ goals: { ...s.goals, ...patch } })),
  }),
  { name: 'pomodoro-goals' }
))