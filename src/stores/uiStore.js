import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Preset ids are stored in saved settings and cloud state, so they stay stable.
// Each preset defines both a dark and a light palette (see index.css).
export const THEME_PRESETS = {
  midnight: { label: 'Tomato', dark: { bg: '#14181D', surface: '#1A2027', accent: '#F2704F' }, light: { bg: '#EDF0F3', surface: '#FFFFFF', accent: '#C7391F' } },
  ocean: { label: 'Harbor', dark: { bg: '#101820', surface: '#16212B', accent: '#4AA3DF' }, light: { bg: '#E9F0F5', surface: '#FFFFFF', accent: '#1B66A0' } },
  purple: { label: 'Plum', dark: { bg: '#17141E', surface: '#1E1A27', accent: '#AD8AE4' }, light: { bg: '#EFEDF4', surface: '#FFFFFF', accent: '#7343B0' } },
  emerald: { label: 'Fern', dark: { bg: '#121A17', surface: '#18221E', accent: '#4DB88A' }, light: { bg: '#EAF1EE', surface: '#FFFFFF', accent: '#1F7355' } },
  rose: { label: 'Rose', dark: { bg: '#1A1419', surface: '#221A20', accent: '#E7819F' }, light: { bg: '#F4EDF0', surface: '#FFFFFF', accent: '#B13E69' } },
  sunset: { label: 'Amber', dark: { bg: '#1A1612', surface: '#221D17', accent: '#E59A3A' }, light: { bg: '#F2EEE8', surface: '#FFFFFF', accent: '#A55F0A' } },
}

export const DEFAULT_PRESET = 'midnight'

/** Cloud state or an old backup may carry a preset id this version does not know. */
export const normalizePreset = (id) => (THEME_PRESETS[id] ? id : DEFAULT_PRESET)

export const useUIStore = create(persist(
  (set) => ({
    theme: 'dark',
    themePreset: 'midnight',
    customAccent: '',
    sidebarCollapsed: false,
    mobileNavOpen: false,
    setTheme: (theme) => set({ theme }),
    setThemePreset: (themePreset) => set({ themePreset, customAccent: '' }),
    setCustomAccent: (customAccent) => set({ customAccent }),
    toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    setMobileNavOpen: (v) => set({ mobileNavOpen: v }),
  }),
  {
    name: 'pomodoro-ui',
    // Transient UI (open drawers) must not be restored or synced.
    partialize: (s) => ({
      theme: s.theme,
      themePreset: s.themePreset,
      customAccent: s.customAccent,
      sidebarCollapsed: s.sidebarCollapsed,
    }),
  }
))
