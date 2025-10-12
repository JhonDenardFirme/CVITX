'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

function normalizeWorkspace(ws) {
  if (!ws || typeof ws !== 'object') return null
  // Prefer `code` (CTX####), but accept legacy shapes too
  const code = ws.code ?? ws.workspace_code ?? ws.workspaceCode ?? null
  return { ...ws, code }
}

function devLog(label, payload) {
  if (typeof window === 'undefined') return
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.groupCollapsed(`[store] ${label}`)
      console.log(payload)
      console.groupEnd()
    } catch { }
  }
}

export const useAppStore = create(
  persist(
    (set, get) => ({
      // ========= Workspace context (single current) =========
      currentWorkspace: null, // { id, title, code?, ... } or null

      setCurrentWorkspace: (ws) => {
        const normalized = normalizeWorkspace(ws)
        devLog('setCurrentWorkspace', normalized ?? ws)
        set({ currentWorkspace: normalized })
      },

      // compatibility alias
      setWorkspace: (ws) => {
        const normalized = normalizeWorkspace(ws)
        devLog('setWorkspace', normalized ?? ws)
        set({ currentWorkspace: normalized })
      },

      // ========= All workspaces (full JSON list) =========
      workspaces: [],

      setWorkspaces: (arr) => {
        const list = Array.isArray(arr) ? arr.map(normalizeWorkspace).filter(Boolean) : []
        devLog('setWorkspaces', list)
        set({ workspaces: list })
      },

      upsertWorkspace: (ws) => {
        const one = normalizeWorkspace(ws)
        if (!one?.id) return
        const cur = get().workspaces || []
        const idx = cur.findIndex((x) => x.id === one.id)
        const next = idx >= 0 ? [...cur.slice(0, idx), { ...cur[idx], ...one }, ...cur.slice(idx + 1)] : [one, ...cur]
        devLog('upsertWorkspace', one)
        set({ workspaces: next })
      },

      removeWorkspace: (id) => {
        const cur = get().workspaces || []
        const next = cur.filter((x) => x.id !== id)
        devLog('removeWorkspace', id)
        set({ workspaces: next })
      },

      clearWorkspaces: () => {
        devLog('clearWorkspaces', true)
        set({ workspaces: [] })
      },

      // ========= Page/UI state =========
      activePanel: 'Indexing',
      setActivePanel: (p) => set({ activePanel: p }),

      selectedRecordId: null,
      setSelectedRecordId: (id) => set({ selectedRecordId: id }),

      // ========= Playback selection (global, ephemeral) =========
      // Allows any component (e.g., IndexingRecords) to know if the user
      // is viewing "all" detections or a specific video's detections.
      playbackMode: 'all', // 'all' | 'video'
      playbackSelectedVideoId: null, // string | null

      setPlaybackAll: () => {
        devLog('setPlaybackAll', true)
        set({ playbackMode: 'all', playbackSelectedVideoId: null })
      },

      setPlaybackVideo: (vid) => {
        const id = typeof vid === 'string' && vid.trim().length > 0 ? vid.trim() : null
        devLog('setPlaybackVideo', id)
        if (!id) {
          set({ playbackMode: 'all', playbackSelectedVideoId: null })
        } else {
          set({ playbackMode: 'video', playbackSelectedVideoId: id })
        }
      },

      // ========= Player seek (one-shot request channel) =========
      // FootagePlayback should consume this and then clear it.
      playerSeekRequest: null, // { videoId: string, ms: number, autoplay?: boolean } | null

      requestPlayerSeek: (req) => {
        // minimal validation to avoid bad shapes
        const videoId = typeof req?.videoId === 'string' ? req.videoId : null
        const ms = Number.isFinite(req?.ms) ? req.ms : null
        const autoplay = !!req?.autoplay
        if (!videoId || ms === null) {
          devLog('requestPlayerSeek:invalid', req)
          return
        }
        const payload = { videoId, ms, autoplay }
        devLog('requestPlayerSeek', payload)
        set({ playerSeekRequest: payload })
      },

      clearPlayerSeekRequest: () => {
        devLog('clearPlayerSeekRequest', true)
        set({ playerSeekRequest: null })
      },

      // ========= Video catalog (ephemeral; used for correct seek offsets) =========
      // Shape: { [wid]: { [videoId]: { id, recorded_at: string|null, durationSec?: number } } }
      videoCatalog: {},

      publishVideos: (wid, videos) => {
        const id = typeof wid === 'string' && wid.trim().length > 0 ? wid.trim() : 'default'
        const prev = get().videoCatalog[id] || {}

        const byId = Object.fromEntries(
          (Array.isArray(videos) ? videos : []).map((v) => [
            v.id,
            {
              id: v.id,
              recorded_at: v.recorded_at || null,
              // NEW meta we want to show in Timeline / actions
              camera_code: v.camera_code || null,
              camera_label: v.camera_label || null,
              file_name: v.file_name || null,
              title: v.title || v.file_name || null,
              // keep duration if you set it later from the player
              durationSec: v.durationSec ?? prev[v.id]?.durationSec,
            },
          ])
        )

        const nextForWid = { ...prev, ...byId }
        const next = { ...get().videoCatalog, [id]: nextForWid }
        devLog('publishVideos', { wid: id, count: Object.keys(byId).length })
        set({ videoCatalog: next })
      },


      updateVideoMeta: (wid, videoId, partial) => {
        const id = typeof wid === 'string' && wid.trim().length > 0 ? wid.trim() : 'default'
        const curWid = get().videoCatalog[id] || {}
        const cur = curWid[videoId] || { id: videoId }
        const next = { ...cur, ...(partial || {}) }
        const nextWid = { ...curWid, [videoId]: next }
        devLog('updateVideoMeta', { wid: id, videoId, partial })
        set({ videoCatalog: { ...get().videoCatalog, [id]: nextWid } })
      },

      getVideoMeta: (wid, videoId) => {
        const id = typeof wid === 'string' && wid.trim().length > 0 ? wid.trim() : 'default'
        return (get().videoCatalog[id] || {})[videoId] || null
      },

      // ========= Timeline (persisted) =========
      timeline: {}, // { [workspaceId]: TimelineItem[] }
      addToTimeline: (wid, det) => {
        const id = wid || 'default'
        const list = get().timeline[id] || []
        const exists = list.some((x) => x.id === det.id)
        const next = exists ? list : [...list, det]
        set({ timeline: { ...get().timeline, [id]: next } })
      },
      removeFromTimeline: (wid, detId) => {
        const id = wid || 'default'
        const list = (get().timeline[id] || []).filter((x) => x.id !== detId)
        set({ timeline: { ...get().timeline, [id]: list } })
      },
      clearTimeline: (wid) => {
        const id = wid || 'default'
        set({ timeline: { ...get().timeline, [id]: [] } })
      },
    }),
    {
      name: 'cvitx-store',
      storage: createJSONStorage(() => localStorage),
      // Persist only timeline; playback selection, seek requests, and videoCatalog are ephemeral by design
      partialize: (s) => ({ timeline: s.timeline }),
    }
  )
)
