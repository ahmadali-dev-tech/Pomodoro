import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid, formatMinutes } from '@/lib/utils'
import { useTaskStore } from './taskStore'
import { useProjectStore } from './projectStore'
import { useSettingsStore } from './settingsStore'
import { useNotificationStore } from './notificationStore'
import { unlockAudio, playRingtone } from '@/lib/audio'
import { showSystemNotification } from '@/lib/notify'

const computeDurationFor = (mode) => {
  const s = useSettingsStore.getState()
  if (mode === 'focus') return s.focusDuration * 60
  if (mode === 'short_break') return s.shortBreakDuration * 60
  return s.longBreakDuration * 60
}

export const useTimerStore = create(persist(
  (set, get) => ({
    mode: 'focus',
    status: 'idle', // idle | running | paused
    remainingSeconds: 25 * 60,
    durationSeconds: 25 * 60,
    endsAt: null,
    pausedAt: null,
    taskId: null,
    completedFocusCount: 0,
    sessionId: null,
    startedAt: null,

    setMode: (mode) => {
      const dur = computeDurationFor(mode)
      set({
        mode,
        status: 'idle',
        remainingSeconds: dur,
        durationSeconds: dur,
        endsAt: null,
        pausedAt: null,
        sessionId: null,
        startedAt: null,
      })
    },

    setTask: (taskId) => set({ taskId }),

    start: () => {
      const { status, remainingSeconds, mode } = get()
      if (status === 'running') return
      unlockAudio()
      const dur = remainingSeconds > 0 ? remainingSeconds : computeDurationFor(mode)
      const now = Date.now()
      set({
        status: 'running',
        remainingSeconds: dur,
        durationSeconds: remainingSeconds > 0 ? get().durationSeconds : dur,
        endsAt: now + dur * 1000,
        pausedAt: null,
        startedAt: get().startedAt || now,
        sessionId: get().sessionId || uid(),
      })
    },

    pause: () => {
      const { status, endsAt } = get()
      if (status !== 'running' || !endsAt) return
      const remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000))
      set({ status: 'paused', remainingSeconds: remaining, endsAt: null, pausedAt: Date.now() })
    },

    resume: () => {
      const { status, remainingSeconds } = get()
      if (status !== 'paused') return
      unlockAudio()
      set({
        status: 'running',
        endsAt: Date.now() + remainingSeconds * 1000,
        pausedAt: null,
      })
    },

    reset: () => {
      const { mode } = get()
      const dur = computeDurationFor(mode)
      set({ status: 'idle', remainingSeconds: dur, durationSeconds: dur, endsAt: null, pausedAt: null, sessionId: null, startedAt: null })
    },

    // Called by tick when countdown reaches zero
    completeCurrent: () => {
      const state = get()
      if (state.status !== 'running') return
      const planned = state.durationSeconds || computeDurationFor(state.mode)
      const settings = useSettingsStore.getState()
      if (settings.soundEnabled) playRingtone(settings.ringtone)

      if (state.mode === 'focus') {
        const taskStore = useTaskStore.getState()
        const projectStore = useProjectStore.getState()
        const task = taskStore.tasks.find(t => t.id === state.taskId)

        // Record session
        taskStore.addSession({
          id: state.sessionId,
          taskId: state.taskId || null,
          projectId: task?.projectId || null,
          sessionType: 'focus',
          status: 'completed',
          plannedDurationSeconds: planned,
          actualDurationSeconds: planned,
          startedAt: state.startedAt || Date.now(),
          endedAt: Date.now(),
          createdAt: Date.now(),
        })
        // Increment task actual pomodoros
        if (task) taskStore.incrementActualPomodoros(task.id)

        if (settings.notificationEnabled) {
          const message = `You completed a ${formatMinutes(planned / 60)} focus session${task ? ` on “${task.title}”` : ''}.`
          useNotificationStore.getState().add({ title: 'Focus session complete', message, type: 'session' })
          showSystemNotification('Focus session complete', message)
        }

        const completedCount = state.completedFocusCount + 1
        const interval = useSettingsStore.getState().longBreakInterval
        const nextMode = completedCount % interval === 0 ? 'long_break' : 'short_break'
        const nextDur = computeDurationFor(nextMode)

        const shouldAuto = useSettingsStore.getState().autoStartBreaks

        set({
          mode: nextMode,
          status: shouldAuto ? 'running' : 'idle',
          remainingSeconds: nextDur,
          durationSeconds: nextDur,
          endsAt: shouldAuto ? Date.now() + nextDur * 1000 : null,
          pausedAt: null,
          sessionId: shouldAuto ? uid() : null,
          startedAt: shouldAuto ? Date.now() : null,
          completedFocusCount: completedCount,
        })
      } else {
        // Break completed
        if (settings.notificationEnabled) {
          useNotificationStore.getState().add({
            title: 'Break complete',
            message: 'Time to get back into focus.',
            type: 'session',
          })
          showSystemNotification('Break complete', 'Time to get back into focus.')
        }
        const nextDur = computeDurationFor('focus')
        const shouldAuto = useSettingsStore.getState().autoStartFocus
        set({
          mode: 'focus',
          status: shouldAuto ? 'running' : 'idle',
          remainingSeconds: nextDur,
          durationSeconds: nextDur,
          endsAt: shouldAuto ? Date.now() + nextDur * 1000 : null,
          pausedAt: null,
          sessionId: shouldAuto ? uid() : null,
          startedAt: shouldAuto ? Date.now() : null,
        })
      }
    },

    tick: () => {
      const { status, endsAt } = get()
      if (status !== 'running' || !endsAt) return
      const remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000))
      if (remaining <= 0) {
        set({ remainingSeconds: 0 })
        get().completeCurrent()
      } else if (remaining !== get().remainingSeconds) {
        set({ remainingSeconds: remaining })
      }
    },
  }),
  {
    name: 'pomodoro-timer',
    partialize: (s) => ({
      mode: s.mode,
      status: s.status,
      remainingSeconds: s.remainingSeconds,
      durationSeconds: s.durationSeconds,
      endsAt: s.endsAt,
      pausedAt: s.pausedAt,
      taskId: s.taskId,
      completedFocusCount: s.completedFocusCount,
      sessionId: s.sessionId,
      startedAt: s.startedAt,
    }),
    merge: (persistedState, currentState) => {
      const persisted = persistedState || {}
      const state = { ...currentState, ...persisted }
      if (!persisted.durationSeconds) {
        state.durationSeconds = computeDurationFor(state.mode)
      }
      return state
    },
  }
))