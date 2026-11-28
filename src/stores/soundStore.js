import { create } from 'zustand'
import { playAmbient, setAmbientVolume, stopAmbient } from '@/lib/audio'

/** Ambient sound state shared by the Focus and Sounds pages, so sound keeps playing between pages. */
export const useSoundStore = create((set, get) => ({
  active: null,
  volume: 60,
  error: null,

  play: (id) => {
    set({ active: id, error: null })
    playAmbient(id, get().volume, (error) => set({ active: null, error }))
  },
  stop: () => {
    stopAmbient()
    set({ active: null })
  },
  toggle: (id) => (get().active === id ? get().stop() : get().play(id)),
  setVolume: (volume) => {
    set({ volume })
    setAmbientVolume(volume)
  },
}))
