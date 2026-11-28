import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useTaskStore } from '@/stores/taskStore'
import { useProjectStore } from '@/stores/projectStore'
import { useHabitStore } from '@/stores/habitStore'
import { useGoalStore } from '@/stores/goalStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useUIStore, normalizePreset } from '@/stores/uiStore'
import { useSyncStore } from '@/stores/syncStore'

const sync = useSyncStore.getState

// Set while this device has edits the cloud doesn't have yet. It survives a refresh, so
// a refresh before the debounced upload finishes can't replace those edits with an older cloud copy.
const DIRTY_KEY = 'pomodoro-sync-dirty'
const markDirty = (userId) => { try { localStorage.setItem(DIRTY_KEY, userId) } catch { /* storage unavailable */ } }
const clearDirty = () => { try { localStorage.removeItem(DIRTY_KEY) } catch { /* storage unavailable */ } }
const isDirty = (userId) => { try { return localStorage.getItem(DIRTY_KEY) === userId } catch { return false } }

const buildState = () => {
  const { theme, themePreset, customAccent, sidebarCollapsed } = useUIStore.getState()
  return {
    tasks: useTaskStore.getState(),
    projects: useProjectStore.getState(),
    habits: useHabitStore.getState(),
    goals: useGoalStore.getState(),
    settings: useSettingsStore.getState(),
    ui: { theme, themePreset, customAccent, sidebarCollapsed },
  }
}

export function useSupabaseSync() {
  const user = useAuthStore(s => s.user)
  const userId = user?.id
  const retryTick = useSyncStore(s => s.retryTick)
  // The user id whose cloud copy has been loaded. Until this matches, local edits are
  // never uploaded, so a failed load can't overwrite the cloud copy with an empty one.
  const loadedUser = useRef(null)
  const saveTimer = useRef(null)
  const hydrating = useRef(false)
  const lastSynced = useRef(null) // JSON of the state known to match the cloud
  const saveSeq = useRef(0)

  useEffect(() => {
    if (!userId) {
      loadedUser.current = null
      sync().setHydrated(true)
      return
    }
    if (loadedUser.current === userId) return

    let cancelled = false
    hydrating.current = true
    sync().setHydrated(false)
    sync().setLoadError(null)
    sync().setStatus('syncing')

    supabase
      .from('app_state')
      .select('state,updated_at')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Unable to load cloud app state', error)
          sync().setLoadError(error.message || 'Unable to reach the server.')
          sync().setStatus(navigator.onLine ? 'error' : 'offline')
          sync().setHydrated(true)
          hydrating.current = false
          return
        }
        loadedUser.current = userId

        // Edits made on this device that never reached the cloud win over the older cloud copy.
        if (isDirty(userId) || !data?.state) {
          hydrating.current = false
          sync().setHydrated(true)
          sync().setStatus('syncing')
          sync().requestSave()
          return
        }

        const state = data.state
        if (state.tasks) useTaskStore.setState(state.tasks)
        if (state.projects) useProjectStore.setState(state.projects)
        if (state.habits) useHabitStore.setState(state.habits)
        if (state.goals) useGoalStore.setState(state.goals)
        if (state.settings) useSettingsStore.setState(state.settings)
        if (state.ui) {
          const { mobileNavOpen, ...ui } = state.ui
          useUIStore.setState({ ...ui, themePreset: normalizePreset(ui.themePreset) })
        }
        lastSynced.current = JSON.stringify(buildState())
        sync().setLastSyncedAt(data.updated_at || new Date().toISOString())
        sync().setStatus('synced')
        sync().setHydrated(true)
        window.setTimeout(() => { hydrating.current = false }, 800)
      })

    return () => { cancelled = true }
  }, [userId, retryTick])

  useEffect(() => {
    if (!userId) return

    function save() {
      if (hydrating.current) return
      // Ignore store notifications that didn't change anything that is synced.
      if (JSON.stringify(buildState()) === lastSynced.current) return
      window.clearTimeout(saveTimer.current)
      markDirty(userId)
      saveSeq.current += 1
      sync().setPendingChanges(true)
      if (loadedUser.current !== userId) return // cloud copy not loaded yet: keep edits on this device
      if (!navigator.onLine) {
        sync().setStatus('offline')
        return
      }
      sync().setStatus('syncing')
      saveTimer.current = window.setTimeout(async () => {
        const seq = saveSeq.current
        const state = buildState()
        const json = JSON.stringify(state)
        const { error } = await supabase.from('app_state').upsert({
          user_id: userId,
          state,
          updated_at: new Date().toISOString(),
        })
        if (error) {
          console.error('Unable to save cloud app state', error)
          sync().setStatus('error')
          return
        }
        lastSynced.current = json
        if (seq === saveSeq.current) {
          clearDirty()
          sync().setPendingChanges(false)
        }
        sync().setLastSyncedAt(new Date().toISOString())
        sync().setStatus('synced')
      }, 800)
    }

    const handleOnline = () => {
      if (loadedUser.current !== userId) sync().requestRetry()
      else save()
    }
    const handleOffline = () => {
      sync().setPendingChanges(true)
      sync().setStatus('offline')
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    if (!navigator.onLine) handleOffline()

    // "Retry" in the header asks for another upload after a failed save.
    const unsubscribeRetry = useSyncStore.subscribe((state, previous) => {
      if (state.saveTick !== previous.saveTick) save()
    })

    const unsubscribers = [
      useTaskStore.subscribe(save),
      useProjectStore.subscribe(save),
      useHabitStore.subscribe(save),
      useGoalStore.subscribe(save),
      useSettingsStore.subscribe(save),
      useUIStore.subscribe(save),
    ]

    return () => {
      unsubscribeRetry()
      window.clearTimeout(saveTimer.current)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }, [userId])
}
