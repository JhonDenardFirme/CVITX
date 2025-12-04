// components/modules/FootagePlayback.jsx
"use client"

/*
  FootagePlayback.jsx
  -------------------
  Purpose:
    Workspace-scoped video player that coordinates playback selection with the
    global store. Supports an "All (no playback)" option that suppresses playback
    and instructs downstream panels to aggregate results across all videos.
    When a specific video is selected, it:
      - fetches a short-lived signed URL and plays it, and
      - requests detections for that video ("cmt" variant) and stores them
        in the global detection slice.

  Store contract used:
    Playback slice:
      - playbackMode: 'all' | 'video'
      - playbackSelectedVideoId: string | null
      - setPlaybackAll()
      - setPlaybackVideo(id)

    Player seek bus:
      - playerSeekRequest
      - clearPlayerSeekRequest()

    Video catalog:
      - videoCatalog[wid][videoId]
      - publishVideos(wid, videos)
      - updateVideoMeta(wid, videoId, partial)
      - getVideoMeta(wid, videoId)

    Detection slice (new):
      - detectionScope: { mode: 'all', videoId: null } | { mode: 'video', videoId: string | null }
      - detectionsLoading: boolean
      - detectionsError: string | null
      - videoDetections: {
          [wid]: {
            byVideoId: { [videoId]: DetectionListOut },
            all: { variant: string, runs: DetectionListOut[] } | null
          }
        }
      - setDetectionScope(scope)
      - setDetectionsLoading(flag)
      - setDetectionsError(messageOrNull)
      - setDetectionsForVideo(wid, videoId, data)
      - setDetectionsForAll(wid, runsArray)

  API routes (via Next.js /api proxy):
    Video list:
      GET /api/workspaces/:wid/videos
        -> { workspaceId, items: VideoRowOut[] }

    Playback URL:
      GET /api/workspaces/:wid/videos/:vid/url
        -> { url, ttl } normalized in the Next route

    Detections (per video):
      GET /api/workspaces/:wid/videos/:vid/detections?variant=cmt
        -> DetectionListOut:
           { workspaceId, videoId, variant, runId, items: [...] }

  Behaviors:
    - Dropdown includes "All (no playback)" plus real videos from catalog.
    - Selecting "All":
        playbackMode = 'all'
        detectionScope = { mode: 'all', videoId: null }
        fetches detections for all videos (front-end aggregated) and stores them.
    - Selecting a specific video:
        playbackMode = 'video'
        detectionScope = { mode: 'video', videoId }
        fetches signed URL and plays it.
        fetches detections for that video (variant "cmt") and stores them.
    - Handles URL expiry by retrying once.
    - Consumes one-shot seek requests from store (if req.videoId matches current).
    - Publishes duration and video dimensions back to store.
    - Prev/Next navigates the real catalog ordering (camera-code aware).

  Notes:
    - If no catalog for the workspace yet, the component loads the list itself
      and publishes it to the store.
    - All calls go through /videos/* routes, not /files/*.
*/

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { useAppStore } from "@/lib/store"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/* ---------------- helpers ---------------- */

function cameraCodeKey(code) {
  if (!code) return [Number.POSITIVE_INFINITY, ""]
  const c = String(code)
  const m = c.match(/(\d+)/)
  return [m ? parseInt(m[1], 10) : Number.POSITIVE_INFINITY, c]
}

function sortByCameraCodeAsc(a, b) {
  const [an, as] = cameraCodeKey(a?.camera_code)
  const [bn, bs] = cameraCodeKey(b?.camera_code)
  if (an !== bn) return an - bn
  return as.localeCompare(bs)
}

function formatTime(seconds) {
  const s = Number.isFinite(seconds) ? Math.max(0, seconds) : 0
  const hrs = Math.floor(s / 3600)
  const mins = Math.floor((s % 3600) / 60)
  const secs = Math.floor(s % 60)
  return [hrs, mins, secs].map((v) => String(v).padStart(2, "0")).join(":")
}

// Thin API helpers

// List videos for a workspace.
// Backend shape: { workspaceId, items: VideoRowOut[] }
// Legacy fallback: plain array.
async function listWorkspaceVideos(wid) {
  const r = await fetch(`/api/workspaces/${wid}/videos`, {
    cache: "no-store",
  })
  if (!r.ok) {
    throw new Error(
      await r.text().catch(() => `Failed to list videos (${r.status})`)
    )
  }

  const j = await r.json()

  // New canonical shape: { workspaceId, items: [...] }
  if (j && Array.isArray(j.items)) {
    return j.items.map((v) => {
      const cameraCode = v.cameraCode ?? v.camera_code ?? null
      const fileName = v.fileName ?? v.file_name ?? null
      return {
        ...v,
        camera_code: cameraCode,
        file_name: fileName,
      }
    })
  }

  // Legacy fallback: API already returns an array
  if (Array.isArray(j)) {
    return j
  }

  // Safe default: no videos
  return []
}

// Get a short-lived playback URL for a video.
async function getVideoPreviewUrl(wid, vid) {
  const r = await fetch(`/api/workspaces/${wid}/videos/${vid}/url`, {
    cache: "no-store",
  })
  if (!r.ok) {
    throw new Error(
      await r.text().catch(() => `Failed to get video URL (${r.status})`)
    )
  }
  const j = await r.json()
  return j?.url || j?.signed_url || j?.href || null
}

// List detections for a single video (current variant = "cmt").
async function listVideoDetections(wid, vid, variant = "cmt") {
  const params = new URLSearchParams({ variant })
  const r = await fetch(
    `/api/workspaces/${wid}/videos/${vid}/detections?${params.toString()}`,
    { cache: "no-store" }
  )
  if (!r.ok) {
    throw new Error(
      await r
        .text()
        .catch(() => `Failed to list detections for video ${vid} (${r.status})`)
    )
  }
  return r.json()
}

// Aggregate detections for all videos in a workspace (front-end fan-out).
async function listWorkspaceDetectionsAll(wid, videos, variant = "cmt") {
  const results = []
  for (const v of videos) {
    if (!v?.id) continue
    try {
      const one = await listVideoDetections(wid, v.id, variant)
      results.push(one)
    } catch (e) {
      console.warn(
        "[playback] detections for video failed:",
        v.id,
        e?.message || e
      )
    }
  }
  return results
}

/* ---------------- component ---------------- */

export default function FootagePlayback() {
  // Workspace resolution
  const params = useParams()
  const widFromParams = params?.workspaceId
  const currentWorkspace = useAppStore((s) => s.currentWorkspace)
  const wid = currentWorkspace?.id || widFromParams || null

  // Store wiring: playback slice
  const playbackMode = useAppStore((s) => s.playbackMode)
  const playbackSelectedVideoId = useAppStore(
    (s) => s.playbackSelectedVideoId
  )
  const setPlaybackAll = useAppStore((s) => s.setPlaybackAll)
  const setPlaybackVideo = useAppStore((s) => s.setPlaybackVideo)

  // Store wiring: seek bus
  const playerSeekRequest = useAppStore((s) => s.playerSeekRequest)
  const clearPlayerSeekRequest = useAppStore(
    (s) => s.clearPlayerSeekRequest
  )

  // Store wiring: video catalog
  const videoCatalog = useAppStore((s) => s.videoCatalog)
  const publishVideos = useAppStore((s) => s.publishVideos)
  const updateVideoMeta = useAppStore((s) => s.updateVideoMeta)
  const getVideoMeta = useAppStore((s) => s.getVideoMeta)

  // Store wiring: detection slice
  const setDetectionScope = useAppStore((s) => s.setDetectionScope)
  const setDetectionsForVideo = useAppStore((s) => s.setDetectionsForVideo)
  const setDetectionsForAll = useAppStore((s) => s.setDetectionsForAll)
  const setDetectionsLoading = useAppStore((s) => s.setDetectionsLoading)
  const setDetectionsError = useAppStore((s) => s.setDetectionsError)

  // Derived catalog for this workspace
  const catalogForWid = videoCatalog?.[wid || "default"] || {}

  const videoList = useMemo(() => {
    const arr = Object.values(catalogForWid)
    return arr.sort((a, b) => {
      const cc = sortByCameraCodeAsc(a, b)
      if (cc !== 0) return cc
      const af = (a?.file_name || "").localeCompare(b?.file_name || "")
      if (af !== 0) return af
      return (a?.id || "").localeCompare(b?.id || "")
    })
  }, [catalogForWid])

  const selectedMeta = useMemo(() => {
    if (!wid || playbackMode !== "video" || !playbackSelectedVideoId) {
      return null
    }
    return getVideoMeta(wid, playbackSelectedVideoId)
  }, [wid, playbackMode, playbackSelectedVideoId, getVideoMeta])

  // Player refs/state
  const videoRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [urlError, setUrlError] = useState(null)
  const [urlRetries, setUrlRetries] = useState(0)
  const [resumeAt, setResumeAt] = useState(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isEditingTime, setIsEditingTime] = useState(false)
  const [inputTime, setInputTime] = useState("00:00:00")
  const [dims, setDims] = useState({ w: null, h: null })

  // Ensure catalog exists (self-load if empty)
  useEffect(() => {
    let cancel = false

    async function ensureCatalog() {
      if (!wid) return
      const hasAny = Object.keys(catalogForWid || {}).length > 0
      if (hasAny) return
      try {
        const arr = await listWorkspaceVideos(wid)
        if (!cancel && Array.isArray(arr)) {
          publishVideos(wid, arr)
        }
      } catch (e) {
        console.warn("[playback] list videos failed:", e?.message || e)
      }
    }

    ensureCatalog()
    return () => {
      cancel = true
    }
  }, [wid, catalogForWid, publishVideos])

  // Load/refresh signed URL when a specific video is selected
  useEffect(() => {
    let cancel = false

    async function resolveUrl() {
      if (!wid || playbackMode !== "video" || !playbackSelectedVideoId) {
        setPreviewUrl(null)
        setUrlError(null)
        setUrlRetries(0)
        return
      }
      try {
        const url = await getVideoPreviewUrl(wid, playbackSelectedVideoId)
        if (cancel) return
        if (!url) {
          setPreviewUrl(null)
          setUrlError("No signed URL returned")
          return
        }
        setPreviewUrl(url)
        setUrlError(null)
        setUrlRetries(0)
      } catch (e) {
        if (cancel) return
        setPreviewUrl(null)
        setUrlError(e?.message || "Failed to fetch signed URL")
      }
    }

    resolveUrl()
    return () => {
      cancel = true
    }
  }, [wid, playbackMode, playbackSelectedVideoId])

  // Consume one-shot external seek requests
  useEffect(() => {
    const req = playerSeekRequest
    if (!req || playbackMode !== "video") return

    const { videoId, ms, autoplay } = req
    if (!videoId || !Number.isFinite(ms)) return
    if (videoId !== playbackSelectedVideoId) return
    if (!previewUrl) return

    const v = videoRef.current
    if (!v) return

    const t = Math.max(0, ms / 1000)
    v.currentTime = t
    setCurrentTime(t)

    if (autoplay) {
      v.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false))
    }

    clearPlayerSeekRequest()
  }, [
    playerSeekRequest,
    playbackMode,
    playbackSelectedVideoId,
    previewUrl,
    clearPlayerSeekRequest,
  ])

  // Handlers
  const handlePlay = () => {
    const v = videoRef.current
    if (!v) return
    v.play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false))
  }

  const handlePause = () => {
    const v = videoRef.current
    if (!v) return
    v.pause()
    setIsPlaying(false)
  }

  const handlePrevFrame = () => {
    const v = videoRef.current
    if (!v) return
    v.pause()
    const step = 1 / 24
    v.currentTime = Math.max(v.currentTime - step, 0)
    setCurrentTime(v.currentTime)
    setIsPlaying(false)
  }

  const handleNextFrame = () => {
    const v = videoRef.current
    if (!v) return
    v.pause()
    const step = 1 / 24
    const baseDuration = duration || v.duration || v.currentTime + step
    v.currentTime = Math.min(v.currentTime + step, baseDuration)
    setCurrentTime(v.currentTime)
    setIsPlaying(false)
  }

  const handlePrevVideo = () => {
    if (videoList.length === 0) return

    if (playbackMode !== "video" || !playbackSelectedVideoId) {
      setPlaybackVideo(videoList[0]?.id)
      return
    }

    const idx = videoList.findIndex((x) => x.id === playbackSelectedVideoId)
    const prevIdx = Math.max(idx - 1, 0)
    setPlaybackVideo(videoList[prevIdx]?.id)
  }

  const handleNextVideo = () => {
    if (videoList.length === 0) return

    if (playbackMode !== "video" || !playbackSelectedVideoId) {
      setPlaybackVideo(videoList[0]?.id)
      return
    }

    const idx = videoList.findIndex((x) => x.id === playbackSelectedVideoId)
    const nextIdx = Math.min(idx + 1, videoList.length - 1)
    setPlaybackVideo(videoList[nextIdx]?.id)
  }

  const handleTimeInputCommit = () => {
    const parts = String(inputTime || "")
      .split(":")
      .map((n) => Number(n))

    if (
      parts.length !== 3 ||
      parts.some((n) => !Number.isFinite(n) || n < 0)
    ) {
      setIsEditingTime(false)
      return
    }

    const newTime = parts[0] * 3600 + parts[1] * 60 + parts[2]
    const v = videoRef.current

    if (v && Number.isFinite(newTime)) {
      const baseDuration = duration || v.duration || newTime
      v.currentTime = Math.min(Math.max(0, newTime), baseDuration)
      setCurrentTime(v.currentTime)
    }

    setIsEditingTime(false)
  }

  const handleVideoError = async () => {
    if (!wid || playbackMode !== "video" || !playbackSelectedVideoId) return

    if (urlRetries >= 1) {
      setUrlError("Playback error: signed URL may have expired.")
      return
    }

    try {
      const v = videoRef.current
      if (v) setResumeAt(v.currentTime || 0)

      const url = await getVideoPreviewUrl(wid, playbackSelectedVideoId)
      setPreviewUrl(url || null)
      setUrlRetries((n) => n + 1)
      setUrlError(null)
    } catch (e) {
      setUrlError(e?.message || "Failed to refresh signed URL")
      setUrlRetries((n) => n + 1)
    }
  }

  const handleLoadedMetadata = (e) => {
    const v = e.currentTarget
    const d = Number.isFinite(v.duration) ? v.duration : 0

    setDuration(d)
    setDims({ w: v.videoWidth || null, h: v.videoHeight || null })

    if (wid && playbackMode === "video" && playbackSelectedVideoId) {
      updateVideoMeta(wid, playbackSelectedVideoId, {
        durationSec: d,
        width: v.videoWidth || null,
        height: v.videoHeight || null,
      })
    }

    if (resumeAt !== null && Number.isFinite(resumeAt)) {
      const safeTime = Math.max(0, Math.min(resumeAt, d || resumeAt))
      v.currentTime = safeTime
      setCurrentTime(v.currentTime)
      setResumeAt(null)
    }
  }

  const handleTimeUpdate = (e) => {
    setCurrentTime(e.currentTarget.currentTime || 0)
  }

  const allLabel = "All (no playback)"

  const selectedLabelCenter = (() => {
    if (playbackMode !== "video" || !selectedMeta) return allLabel
    return (
      selectedMeta?.file_name ||
      selectedMeta?.title ||
      selectedMeta?.id ||
      allLabel
    )
  })()

  const dimsLabel = (() => {
    if (dims?.w && dims?.h) return `${dims.w} × ${dims.h}`
    return "—"
  })()

  return (
    <div className="w-full h-full flex flex-col p-8 items-center">
      {/* Header strip */}
      <div className="h-12 w-full rounded-md border border-neutral-700 mb-4 px-4 flex items-center justify-between">
        {/* Left: selector */}
        <div className="w-64 h-8 px-4 gap-4 flex flex-row items-center justify-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/video.svg" alt="Video" className="w-4 h-4" />
          <Select
            value={
              playbackMode === "all"
                ? "all"
                : playbackSelectedVideoId || "all"
            }
            onValueChange={async (val) => {
              if (!wid) return

              setDetectionsError(null)

              if (val === "all") {
                setPlaybackAll()
                setDetectionScope({ mode: "all", videoId: null })

                try {
                  setDetectionsLoading(true)
                  const aggregated = await listWorkspaceDetectionsAll(
                    wid,
                    videoList,
                    "cmt"
                  )
                  setDetectionsForAll(wid, aggregated)
                } catch (e) {
                  setDetectionsError(
                    e?.message ||
                      "Failed to load detections for all videos"
                  )
                } finally {
                  setDetectionsLoading(false)
                }
              } else {
                setPlaybackVideo(val)
                setDetectionScope({ mode: "video", videoId: val })

                try {
                  setDetectionsLoading(true)
                  const data = await listVideoDetections(wid, val, "cmt")
                  setDetectionsForVideo(wid, val, data)
                } catch (e) {
                  setDetectionsError(
                    e?.message ||
                      `Failed to load detections for video ${val}`
                  )
                } finally {
                  setDetectionsLoading(false)
                }
              }
            }}
          >
            <SelectTrigger className="w-48 h-8 text-xs px-1 py-2">
              <SelectValue placeholder={allLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                {allLabel}
              </SelectItem>
              {videoList.map((v) => {
                const left = v?.camera_code ? `${v.camera_code}` : "CAM-—"
                const right = v?.file_name || v?.title || v?.id
                return (
                  <SelectItem key={v.id} value={v.id} className="text-xs">
                    {left} | {right}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Center: filename/title */}
        <div className="w-64 h-8 px-4 flex flex-row items-center justify-center">
          <p className="text-xs text-white truncate">
            {selectedLabelCenter}
          </p>
        </div>

        {/* Right: dynamic resolution */}
        <div className="w-64 h-8 px-4 gap-2 flex flex-row items-center justify-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/hd.svg"
            alt="Resolution"
            className="w-4 h-4"
          />
          <p className="text-xs text-muted-foreground">{dimsLabel}</p>
        </div>
      </div>

      {/* Player area */}
      <div className="h-[80%] w-auto rounded-xl overflow-hidden bg-black flex items-center justify-center">
        {playbackMode === "all" ? (
          <div className="h-full w-full flex items-center justify-center">
            <span className="text-[12px] text-neutral-400">
              All Mode — No playback. Results below aggregate across all
              videos.
            </span>
          </div>
        ) : previewUrl ? (
          <video
            ref={videoRef}
            key={`${playbackSelectedVideoId}:${previewUrl}`}
            src={previewUrl}
            className="h-full w-auto object-contain rounded-xl"
            controls={false}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onError={handleVideoError}
          />
        ) : urlError ? (
          <div className="h-full w-full flex items-center justify-center">
            <span className="text-[12px] text-red-400">{urlError}</span>
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <span className="text-[12px] text-neutral-400">
              Loading video…
            </span>
          </div>
        )}
      </div>

      {/* Transport & timeline */}
      <div className="w-full mt-4 flex items-center gap-4 px-4">
        {isEditingTime ? (
          <input
            type="text"
            value={inputTime}
            onChange={(e) => setInputTime(e.target.value)}
            onBlur={handleTimeInputCommit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTimeInputCommit()
            }}
            className="bg-neutral-800 text-white rounded px-2 py-0.5 w-[72px] text-sm text-center"
          />
        ) : (
          <span
            onClick={() => {
              if (playbackMode === "all") return
              setInputTime(formatTime(currentTime))
              setIsEditingTime(true)
            }}
            className={`text-sm ${
              playbackMode === "all"
                ? "text-neutral-600 cursor-not-allowed"
                : "text-orange-500 cursor-pointer"
            } tabular-nums w-[72px] text-center`}
          >
            {formatTime(playbackMode === "all" ? 0 : currentTime)}
          </span>
        )}

        <input
          type="range"
          min={0}
          max={playbackMode === "all" ? 0 : duration || 0}
          value={playbackMode === "all" ? 0 : currentTime}
          onChange={(e) => {
            if (playbackMode === "all") return
            const newTime = parseFloat(e.target.value)
            setCurrentTime(newTime)
            const v = videoRef.current
            if (v) v.currentTime = newTime
          }}
          className="flex-1 accent-orange-500 h-1 rounded-lg appearance-none bg-neutral-700"
          disabled={playbackMode === "all"}
        />

        <span className="text-sm text-white tabular-nums w-[72px] text-center">
          {formatTime(playbackMode === "all" ? 0 : duration)}
        </span>
      </div>

      <div className="w-full h-[10%] mt-4 flex items-center justify-center gap-4 bg-neutral-900 rounded-sm px-6">
        <button
          onClick={handlePrevVideo}
          className={`p-3 rounded-full ${
            videoList.length
              ? "bg-neutral-800 hover:bg-neutral-700"
              : "bg-neutral-800/50 cursor-not-allowed"
          }`}
          disabled={!videoList.length}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/prev.svg"
            alt="Previous Video"
            className="w-5 h-5"
          />
        </button>

        <button
          onClick={handlePrevFrame}
          className={`p-3 rounded-full ${
            playbackMode === "video"
              ? "bg-neutral-800 hover:bg-neutral-700"
              : "bg-neutral-800/50 cursor-not-allowed"
          }`}
          disabled={playbackMode !== "video"}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/prevframe.svg"
            alt="Previous Frame"
            className="w-5 h-5"
          />
        </button>

        {isPlaying ? (
          <button
            onClick={handlePause}
            className={`p-3 rounded-full ${
              playbackMode === "video"
                ? "bg-neutral-800 hover:bg-neutral-700"
                : "bg-neutral-800/50 cursor-not-allowed"
            }`}
            disabled={playbackMode !== "video"}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/pause.svg"
              alt="Pause"
              className="w-5 h-5"
            />
          </button>
        ) : (
          <button
            onClick={handlePlay}
            className={`p-3 rounded-full ${
              playbackMode === "video"
                ? "bg-neutral-800 hover:bg-neutral-700"
                : "bg-neutral-800/50 cursor-not-allowed"
            }`}
            disabled={playbackMode !== "video"}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/play.svg" alt="Play" className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={handleNextFrame}
          className={`p-3 rounded-full ${
            playbackMode === "video"
              ? "bg-neutral-800 hover:bg-neutral-700"
              : "bg-neutral-800/50 cursor-not-allowed"
          }`}
          disabled={playbackMode !== "video"}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/nextframe.svg"
            alt="Next Frame"
            className="w-5 h-5"
          />
        </button>

        <button
          onClick={handleNextVideo}
          className={`p-3 rounded-full ${
            videoList.length
              ? "bg-neutral-800 hover:bg-neutral-700"
              : "bg-neutral-800/50 cursor-not-allowed"
          }`}
          disabled={!videoList.length}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/next.svg" alt="Next Video" className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
