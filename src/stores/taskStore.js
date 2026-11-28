import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '@/lib/utils'

export const useTaskStore = create(persist(
  (set) => ({
    tasks: [],
    sessions: [],

    addTask: (data) => {
      const task = {
        id: uid(),
        createdAt: Date.now(),
        status: 'todo',
        actualPomodoros: 0,
        priority: 'medium',
        estimatedPomodoros: 1,
        description: '',
        projectId: '',
        dueDate: null,
        ...data,
      }
      set((s) => ({ tasks: [task, ...s.tasks] }))
      return task
    },

    updateTask: (id, patch) => set((s) => ({
      tasks: s.tasks.map(t => t.id === id ? { ...t, ...patch } : t),
    })),

    deleteTask: (id) => set((s) => ({
      tasks: s.tasks.filter(t => t.id !== id),
    })),

    completeTask: (id) => set((s) => ({
      tasks: s.tasks.map(t => t.id === id
        ? { ...t, status: 'completed', completedAt: Date.now() }
        : t),
    })),

    reopenTask: (id) => set((s) => ({
      tasks: s.tasks.map(t => t.id === id
        ? { ...t, status: 'todo', completedAt: null }
        : t),
    })),

    /** Move a task between board columns, keeping completedAt consistent with status. */
    setTaskStatus: (id, status) => set((s) => ({
      tasks: s.tasks.map(t => {
        if (t.id !== id || t.status === status) return t
        return status === 'completed'
          ? { ...t, status, completedAt: Date.now() }
          : { ...t, status, completedAt: null }
      }),
    })),

    /** Keep tasks when their project is deleted: they simply become unassigned. */
    unassignProject: (projectId) => set((s) => ({
      tasks: s.tasks.map(t => t.projectId === projectId ? { ...t, projectId: '' } : t),
    })),

    incrementActualPomodoros: (id) => set((s) => ({
      tasks: s.tasks.map(t => t.id === id
        ? { ...t, actualPomodoros: (t.actualPomodoros || 0) + 1 }
        : t),
    })),

    addSession: (session) => set((s) => ({
      sessions: [session, ...s.sessions],
    })),
  }),
  {
    name: 'pomodoro-tasks',
    partialize: (state) => ({
      tasks: state.tasks,
      sessions: state.sessions,
    }),
  }
))
