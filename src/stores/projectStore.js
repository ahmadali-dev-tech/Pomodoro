import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '@/lib/utils'

export const useProjectStore = create(persist(
  (set) => ({
    projects: [],
    sharedProjects: [],

    addProject: (data) => set((s) => ({
      projects: [{ id: uid(), createdAt: Date.now(), status: 'active', ...data }, ...s.projects],
    })),

    updateProject: (id, patch) => set((s) => ({
      projects: s.projects.map(p => p.id === id ? { ...p, ...patch } : p),
    })),

    deleteProject: (id) => set((s) => ({
      projects: s.projects.filter(p => p.id !== id),
    })),

    setSharedProjects: (sharedProjects) => set({ sharedProjects }),
  }),
  {
    name: 'pomodoro-projects',
    partialize: (state) => ({
      projects: state.projects,
      sharedProjects: state.sharedProjects,
    }),
  }
))