// lib/store.js
"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

/*
  Global UI Store (Zustand)
  -------------------------
  Responsibilities:

  1) Workspace context
     - currentWorkspace: { id, title, code, and other metadata } | null
     - workspaces: full list of known workspaces
     - normalizeWorkspace() ensures .code is always present (from code/workspace_code/workspaceCode)

  2) Page / UI selection
     - activePanel: "Indexing" | "Playback" | "Upload" | "Settings" | and other panels
     - selectedRecordId: legacy table row selection (pure UI highlight)

  3) Playback scope (global)
     - playbackMode: "all" | "video"
     - playbackSelectedVideoId: string | null
     - setPlaybackAll(), setPlaybackVideo(videoId)

  4) Player seek bus (one-shot)
     - playerSeekRequest: { videoId, ms, autoplay? } | null
     - requestPlayerSeek({ videoId, ms, autoplay? })
     - clearPlayerSeekRequest()

  5) Video catalog (per-workspace metadata cache, ephemeral)
     - videoCatalog: {
         [workspaceId]: {
           [videoId]: {
             id: string
             recorded_at: string | null
             camera_code: string | null
             camera_label: string | null
             file_name: string | null
             title: string | null
             durationSec?: number
           }
         }
       }
     - publishVideos(workspaceId, videosFromApi)
     - updateVideoMeta(workspaceId, videoId, partial)
     - getVideoMeta(workspaceId, videoId)

  6) Video detections scope + cache (per-workspace, ephemeral)
     - detectionScope: { mode: "all" | "video", videoId: string | null }
     - detectionsLoading: boolean
     - detectionsError: string | null
     - videoDetections: {
         [workspaceId]: {
           byVideoId: { [videoId]: DetectionListOut },
           all: { variant: string, runs: DetectionListOut[] } | null
         }
       }

  7) Timeline (persisted across reloads)
     - timeline: { [workspaceId]: TimelineItem[] }

     Canonical TimelineItem shape (for both image and video analysis):

       {
         id: string,              // unique per timeline item
         videoId?: string,        // associated video (for video analysis)
         detectionId?: string,    // associated detection row
         ms?: number,             // millisecond offset in the video
         label?: string,          // human label or tag
         note?: string,           // optional extra note
         createdAt?: string,      // ISO timestamp when bookmark added
         kind?: "video" | "image" | "other"
       }

     - addToTimeline(workspaceId, item)
     - removeFromTimeline(workspaceId, itemId)
     - clearTimeline(workspaceId)

  Persistence:
    - Only `timeline` is persisted via localStorage.
    - Workspace, playback selection, player seek, videoCatalog, and videoDetections
      are all ephemeral.
*/

function normalizeWorkspace(ws) {
  if (!ws || typeof ws !== "object") return null
  // Prefer `code` (CTX####), but accept legacy shapes too
  const code = ws.code ?? ws.workspace_code ?? ws.workspaceCode ?? null
  return {
    ...ws,
    code,
  }
}

function devLog(label, payload) {
  if (typeof window === "undefined") return
  if (process.env.NODE_ENV !== "production") {
    try {
      console.groupCollapsed(`[store] ${label}`)
      console.log(payload)
      console.groupEnd()
    } catch {
      // no-op in environments that block console methods
    }
  }
}

export const useAppStore = create(
  persist(
    (set, get) => ({
      // ========= Workspace context (single current) =========
      currentWorkspace: null, // { id, title, code, and other metadata } or null

      setCurrentWorkspace: (ws) => {
        const normalized = normalizeWorkspace(ws)
        devLog("setCurrentWorkspace", normalized ?? ws)
        set({
          currentWorkspace: normalized,
          // reset playback scope when switching workspaces
          playbackMode: "all",
          playbackSelectedVideoId: null,
          playerSeekRequest: null,
          selectedRecordId: null,
          // reset detection scope and loading when switching workspaces
          detectionScope: { mode: "all", videoId: null },
          detectionsLoading: false,
          detectionsError: null,
        })
      },

      // compatibility alias (legacy callers)
      setWorkspace: (ws) => {
        const normalized = normalizeWorkspace(ws)
        devLog("setWorkspace", normalized ?? ws)
        set({
          currentWorkspace: normalized,
          // reset playback scope when switching workspaces
          playbackMode: "all",
          playbackSelectedVideoId: null,
          playerSeekRequest: null,
          selectedRecordId: null,
          // reset detection scope and loading when switching workspaces
          detectionScope: { mode: "all", videoId: null },
          detectionsLoading: false,
          detectionsError: null,
        })
      },

      // ========= All workspaces (full JSON list) =========
      workspaces: [],

      setWorkspaces: (arr) => {
        const list = Array.isArray(arr)
          ? arr.map(normalizeWorkspace).filter(Boolean)
          : []
        devLog("setWorkspaces", list)
        set({ workspaces: list })
      },

      upsertWorkspace: (ws) => {
        const one = normalizeWorkspace(ws)
        if (!one?.id) return
        const cur = get().workspaces || []
        const idx = cur.findIndex((x) => x.id === one.id)
        const next =
          idx >= 0
            ? [
                ...cur.slice(0, idx),
                { ...cur[idx], ...one },
                ...cur.slice(idx + 1),
              ]
            : [one, ...cur]
        devLog("upsertWorkspace", one)
        set({ workspaces: next })
      },

      removeWorkspace: (id) => {
        const cur = get().workspaces || []
        const next = cur.filter((x) => x.id !== id)
        devLog("removeWorkspace", id)
        set({ workspaces: next })
      },

      clearWorkspaces: () => {
        devLog("clearWorkspaces", true)
        set({ workspaces: [] })
      },

      // ========= Page and UI state =========
      // Treat activePanel as a simple string union such as:
      // "Indexing" | "Playback" | "Upload" | "Settings" | and other panels
      activePanel: "Indexing",
      setActivePanel: (p) => {
        devLog("setActivePanel", p)
        set({ activePanel: p })
      },

      // Legacy global row selection (Indexing table highlight and detail panel)
      selectedRecordId: null,
      setSelectedRecordId: (id) => {
        devLog("setSelectedRecordId", id)
        set({ selectedRecordId: id })
      },

      // ========= Playback selection (global, ephemeral) =========
      // Allows any component (for example IndexingRecords) to know if the user
      // is viewing "all" detections or a specific video's detections.
      playbackMode: "all", // "all" | "video"
      playbackSelectedVideoId: null, // string | null

      setPlaybackAll: () => {
        devLog("setPlaybackAll", true)
        set({ playbackMode: "all", playbackSelectedVideoId: null })
      },

      setPlaybackVideo: (vid) => {
        const id =
          typeof vid === "string" && vid.trim().length > 0
            ? vid.trim()
            : null
        devLog("setPlaybackVideo", id)
        if (!id) {
          set({ playbackMode: "all", playbackSelectedVideoId: null })
        } else {
          set({ playbackMode: "video", playbackSelectedVideoId: id })
        }
      },

      // ========= Player seek (one-shot request channel) =========
      // FootagePlayback should consume this and then clear it.
      // Shape: { videoId: string, ms: number, autoplay?: boolean } | null
      playerSeekRequest: null,

      requestPlayerSeek: (req) => {
        // minimal validation to avoid bad shapes
        const videoId =
          typeof req?.videoId === "string" && req.videoId.trim().length > 0
            ? req.videoId.trim()
            : null
        const ms =
          req && Number.isFinite(req.ms)
            ? req.ms
            : null
        const autoplay = !!req?.autoplay

        if (!videoId || ms === null) {
          devLog("requestPlayerSeek:invalid", req)
          return
        }

        const payload = { videoId, ms, autoplay }
        devLog("requestPlayerSeek", payload)
        set({ playerSeekRequest: payload })
      },

      clearPlayerSeekRequest: () => {
        devLog("clearPlayerSeekRequest", true)
        set({ playerSeekRequest: null })
      },

      // ========= Video catalog (ephemeral; used for correct seek offsets) =========
      // Shape:
      //   {
      //     [workspaceId]: {
      //       [videoId]: {
      //         id: string,
      //         recorded_at: string | null,
      //         camera_code: string | null,
      //         camera_label: string | null,
      //         file_name: string | null,
      //         title: string | null,
      //         durationSec?: number
      //       }
      //     }
      //   }
      videoCatalog: {},

      publishVideos: (wid, videos) => {
        const workspaceId =
          typeof wid === "string" && wid.trim().length > 0
            ? wid.trim()
            : "default"
        const prevForWid = get().videoCatalog[workspaceId] || {}

        const byId = Object.fromEntries(
          (Array.isArray(videos) ? videos : []).map((v) => {
            if (!v || !v.id) {
              return [null, null]
            }

            // Accept both camelCase (VideoRowOut) and legacy snake_case shapes
            const recorded_at = v.recorded_at ?? v.recordedAt ?? null
            const camera_code = v.camera_code ?? v.cameraCode ?? null
            const camera_label = v.camera_label ?? v.cameraLabel ?? null
            const file_name = v.file_name ?? v.fileName ?? null
            const title = v.title ?? file_name ?? null

            return [
              v.id,
              {
                id: v.id,
                recorded_at,
                // meta we want to show in Timeline and actions
                camera_code,
                camera_label,
                file_name,
                title,
                // keep duration if you set it later from the player
                durationSec:
                  v.durationSec ?? prevForWid[v.id]?.durationSec ?? null,
              },
            ]
          }).filter(([id]) => !!id)
        )

        const nextForWid = { ...prevForWid, ...byId }
        const next = { ...get().videoCatalog, [workspaceId]: nextForWid }
        devLog("publishVideos", {
          wid: workspaceId,
          count: Object.keys(byId).length,
        })
        set({ videoCatalog: next })
      },

      updateVideoMeta: (wid, videoId, partial) => {
        const workspaceId =
          typeof wid === "string" && wid.trim().length > 0
            ? wid.trim()
            : "default"
        const curWid = get().videoCatalog[workspaceId] || {}
        const cur = curWid[videoId] || { id: videoId }
        const next = { ...cur, ...(partial || {}) }
        const nextWid = { ...curWid, [videoId]: next }
        devLog("updateVideoMeta", {
          wid: workspaceId,
          videoId,
          partial,
        })
        set({
          videoCatalog: {
            ...get().videoCatalog,
            [workspaceId]: nextWid,
          },
        })
      },

      getVideoMeta: (wid, videoId) => {
        const workspaceId =
          typeof wid === "string" && wid.trim().length > 0
            ? wid.trim()
            : "default"
        return (get().videoCatalog[workspaceId] || {})[videoId] || null
      },

      // ========= Video detections scope and cache =========
      // detectionScope tells the UI whether we are aggregating across all videos
      // ("all") or focusing on a single video's detections ("video").
      //
      // Shape:
      //   detectionScope:
      //     { mode: "all", videoId: null } |
      //     { mode: "video", videoId: string | null }
      //
      // videoDetections caches DetectionListOut payloads keyed by workspace and
      // by videoId, plus an optional "all" aggregate representing the
      // workspace-level fan-out.
      //
      // Shape:
      //   videoDetections: {
      //     [workspaceId]: {
      //       byVideoId: { [videoId]: DetectionListOut },
      //       all: { variant: string, runs: DetectionListOut[] } | null
      //     }
      //   }
      detectionScope: { mode: "all", videoId: null },
      detectionsLoading: false,
      detectionsError: null,
      videoDetections: {},

      setDetectionScope: (scope) => {
        if (!scope || (scope.mode !== "all" && scope.mode !== "video")) {
          return
        }
        devLog("setDetectionScope", scope)
        set({ detectionScope: scope })
      },

      setDetectionsLoading: (flag) => {
        const value = !!flag
        devLog("setDetectionsLoading", value)
        set({ detectionsLoading: value })
      },

      setDetectionsError: (msg) => {
        const value = msg || null
        devLog("setDetectionsError", value)
        set({ detectionsError: value })
      },

      setDetectionsForVideo: (wid, videoId, data) => {
        if (!wid || !videoId || !data) return

        const current = get().videoDetections || {}
        const entry = current[wid] || { byVideoId: {}, all: null }

        const byVideoId = {
          ...entry.byVideoId,
          [videoId]: data,
        }

        const next = {
          ...current,
          [wid]: { ...entry, byVideoId },
        }

        const count = Array.isArray(data.items) ? data.items.length : 0
        devLog("setDetectionsForVideo", { wid, videoId, count })

        set({ videoDetections: next })
      },

      setDetectionsForAll: (wid, runsArray) => {
        if (!wid) return

        const current = get().videoDetections || {}
        const entry = current[wid] || { byVideoId: {}, all: null }

        const arr = Array.isArray(runsArray) ? runsArray : []
        const variant =
          arr[0] && arr[0].variant ? arr[0].variant : "cmt"

        const allPayload = {
          variant,
          runs: arr,
        }

        const next = {
          ...current,
          [wid]: { ...entry, all: allPayload },
        }

        devLog("setDetectionsForAll", { wid, videos: arr.length })

        set({ videoDetections: next })
      },

      // ========= Timeline (persisted) =========
      // Shape: { [workspaceId]: TimelineItem[] }
      // See header comment for TimelineItem canonical shape.
      timeline: {},

      addToTimeline: (wid, det) => {
        const workspaceId =
          typeof wid === "string" && wid.trim().length > 0
            ? wid.trim()
            : "default"
        const list = get().timeline[workspaceId] || []
        if (!det || !det.id) {
          devLog("addToTimeline:invalid", { wid: workspaceId, det })
          return
        }
        const exists = list.some((x) => x.id === det.id)
        const next = exists ? list : [...list, det]
        devLog("addToTimeline", {
          wid: workspaceId,
          addedId: det.id,
          deduped: exists,
        })
        set({
          timeline: {
            ...get().timeline,
            [workspaceId]: next,
          },
        })
      },

      removeFromTimeline: (wid, detId) => {
        const workspaceId =
          typeof wid === "string" && wid.trim().length > 0
            ? wid.trim()
            : "default"
        const list = (get().timeline[workspaceId] || []).filter(
          (x) => x.id !== detId
        )
        devLog("removeFromTimeline", {
          wid: workspaceId,
          removedId: detId,
        })
        set({
          timeline: {
            ...get().timeline,
            [workspaceId]: list,
          },
        })
      },

      clearTimeline: (wid) => {
        const workspaceId =
          typeof wid === "string" && wid.trim().length > 0
            ? wid.trim()
            : "default"
        devLog("clearTimeline", workspaceId)
        set({
          timeline: {
            ...get().timeline,
            [workspaceId]: [],
          },
        })
      },
    }),
    {
      name: "cvitx-store",
      storage: createJSONStorage(() => localStorage),
      // Persist only timeline; playback selection, seek requests, videoCatalog,
      // and videoDetections are ephemeral by design
      partialize: (s) => ({
        timeline: s.timeline,
      }),
    }
  )
)
