import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ user: session?.user || null, loading: false, initialized: true })

    supabase.auth.onAuthStateChange((_event, nextSession) => {
      set({ user: nextSession?.user || null, loading: false, initialized: true })
    })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))
