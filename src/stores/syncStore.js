import { create } from 'zustand'

export const useSyncStore = create((set) => ({
  status: 'idle', // idle | syncing | synced | offline | error
  lastSyncedAt: null,
  pendingChanges: false,
  /** True once the first cloud load has finished (successfully or not). */
  hydrated: false,
  /** Set when the first cloud load failed; local edits are then kept on this device only. */
  loadError: null,
  retryTick: 0,
  saveTick: 0,
  setStatus: (status) => set({ status }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
  setPendingChanges: (pendingChanges) => set({ pendingChanges }),
  setHydrated: (hydrated) => set({ hydrated }),
  setLoadError: (loadError) => set({ loadError }),
  requestRetry: () => set((s) => ({ retryTick: s.retryTick + 1 })),
  requestSave: () => set((s) => ({ saveTick: s.saveTick + 1 })),
}))
