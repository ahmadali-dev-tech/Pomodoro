import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSettingsStore = create(persist(
  (set) => ({
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: true,
    autoStartFocus: false,
    soundEnabled: true,
    ringtone: 'chime',
    notificationEnabled: true,
    accent: 'purple',
    glassIntensity: 'medium',
    reducedMotion: false,

    update: (patch) => set(patch),
  }),
  { name: 'pomodoro-settings' }
))