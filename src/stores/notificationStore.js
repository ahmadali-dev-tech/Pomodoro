import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '@/lib/utils'

const MAX_ITEMS = 200

export const useNotificationStore = create(persist(
  (set) => ({
    items: [],

    add: (n) => set((s) => ({
      items: [{ id: uid(), isRead: false, createdAt: Date.now(), ...n }, ...s.items].slice(0, MAX_ITEMS),
    })),

    markRead: (id) => set((s) => ({
      items: s.items.map(n => n.id === id ? { ...n, isRead: true } : n),
    })),

    markAllRead: () => set((s) => ({
      items: s.items.map(n => ({ ...n, isRead: true })),
    })),

    remove: (id) => set((s) => ({
      items: s.items.filter(n => n.id !== id),
    })),

    clearAll: () => set({ items: [] }),
  }),
  { name: 'pomodoro-notifications' }
))
