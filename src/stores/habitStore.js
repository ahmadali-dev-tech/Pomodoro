import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid, todayISO } from '@/lib/utils'

export const useHabitStore = create(persist(
  (set) => ({
    habits: [],

    addHabit: (data) => set((s) => ({
      habits: [{ id: uid(), logs: [], isActive: true, ...data }, ...s.habits],
    })),

    updateHabit: (id, patch) => set((s) => ({
      habits: s.habits.map(h => h.id === id ? { ...h, ...patch } : h),
    })),

    deleteHabit: (id) => set((s) => ({
      habits: s.habits.filter(h => h.id !== id),
    })),

    toggleLog: (id, dateISO = todayISO()) => set((s) => ({
      habits: s.habits.map(h => {
        if (h.id !== id) return h
        const has = h.logs.includes(dateISO)
        return { ...h, logs: has ? h.logs.filter(d => d !== dateISO) : [...h.logs, dateISO] }
      }),
    })),
  }),
  {
    name: 'pomodoro-habits',
    partialize: (state) => ({ habits: state.habits }),
  }
))