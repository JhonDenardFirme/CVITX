"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { useAppStore } from "@/lib/store"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const AUTO = "__AUTO__" // sentinel for "All videos (Auto)"

const formatTime = (seconds) => {
  const s = Math.max(0, Math.floor(seconds || 0))
  const hrs = Math.floor(s / 3600)
  const mins = Math.floor((s % 3600) / 60)
  const secs = s % 60
  return [hrs, mins, secs].map((v) => String(v).padStart(2, "0")).join(":")
}

/* ---------- shared helpers (align with FootageUpload) ---------- */

function useIsMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  return mounted
}



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
function fmtHuman(dt) {
  if (!dt) return "—"
  const d = typeof dt === "string" ? new Date(dt) : dt
  const dPart = new Intl.DateTimeFormat(undefined, { month: "short", day: "2-digit", year: "numeric" }).format(d)
  const tPart = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(d)
  return `${dPart} | ${tPart}`
}

/* ---------- API helpers (same /api proxy layer) ---------- */
async function listVideos(wid) {
  const r = await fetch(`/api/workspaces/${wid}/videos`, { cache: "no-store" })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}
async function getPreviewUrl(wid, vid) {
  const r = await fetch(`/api/workspaces/${wid}/videos/${vid}/url`, { cache: "no-store" })
  if (!r.ok) {
    const txt = await r.text().catch(() => "")
    throw new Error(`preview-url ${r.status}: ${txt || "failed"}`)
  }
  const j = await r.json()
  return j?.url || j?.signed_url || j?.href || null
}

export default function FootagePlayback() {

  const isMounted = useIsMounted();

  /* ---------- resolve workspace ---------- */
  const params = useParams()
  const widFromParams = params?.workspaceId
  const currentWorkspace = useAppStore((s) => s.currentWorkspace)
  const wid = currentWorkspace?.id || widFromParams || null

  /* ---------- publish selection to store ---------- */
  const setPlaybackAll = useAppStore((s) => s.setPlaybackAll)
  const setPlaybackVideo = useAppStore((s) => s.setPlaybackVideo)

  /* ---------- NEW: publish video catalog ---------- */
  const setCatalog = useAppStore((s) => s.publishVideos)

  /* ---------- consume player seek requests ---------- */
  const playerSeekRequest = useAppStore((s) => s.playerSeekRequest)
  const clearPlayerSeekRequest = useAppStore((s) => s.clearPlayerSeekRequest)

  /* ---------- list + selection state ---------- */
  const [videos, setVideos] = useState([])
  const sortedVideos = useMemo(() => [...videos].sort(sortByCameraCodeAsc), [videos])

  const [selectedVideoId, setSelectedVideoId] = useState(null)
  const selectedIndex = useMemo(
    () => sortedVideos.findIndex((v) => v.id === selectedVideoId),
    [sortedVideos, selectedVideoId]
  )
  const selectedVideo = selectedIndex >= 0 ? sortedVideos[selectedIndex] : null

  /* ---------- playback states ---------- */
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isEditingTime, setIsEditingTime] = useState(false)
  const [inputTime, setInputTime] = useState("00:00:00")
  const [resolution, setResolution] = useState({ w: null, h: null })

  /* ---------- preview URL (signed GET) ---------- */
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [previewTries, setPreviewTries] = useState(0) // one retry on 403/expired
  const previewCacheRef = useRef({}) // { [videoId]: url }

  /* ---------- load list on wid change ---------- */
  useEffect(() => {
    let ignore = false
    async function load() {
      if (!wid) return
      try {
        const arr = await listVideos(wid)
        if (ignore) return
        if (process.env.NODE_ENV !== "production") {
          console.groupCollapsed(`[player:list] wid=${wid}`)
          if (!Array.isArray(arr)) console.warn("Response was not an array:", arr)
          else {
            console.log(`count: ${arr.length}`)
            console.table(arr.map(v => ({
              id: v.id,
              file_name: v.file_name,
              camera_code: v.camera_code,
              camera_label: v.camera_label,
              status: v.status,
              recorded_at: v.recorded_at,
            })))
          }
          console.groupEnd()
        }

        // NEW: publish id + recorded_at into the store catalog
        // NEW: publish rich meta for Timeline labeling, not just id + recorded_at
        setCatalog(
          wid,
          (Array.isArray(arr) ? arr : []).map((v) => ({
            id: v.id,
            recorded_at: v.recorded_at,
            camera_code: v.camera_code,
            camera_label: v.camera_label,
            file_name: v.file_name,
            title: v.title || v.file_name,
          }))
        )

        

        setVideos(Array.isArray(arr) ? arr : [])
        // default selection: first in sorted list (NOT Auto)
        setSelectedVideoId((prev) => {
          if (prev === AUTO) return prev
          if (prev && arr.some(x => x.id === prev)) return prev
          const first = Array.isArray(arr) && arr.length > 0 ? [...arr].sort(sortByCameraCodeAsc)[0] : null
          return first?.id || null
        })
      } catch (e) {
        console.error("[player:list] failed:", e)
        setVideos([])
        setSelectedVideoId(null)
      }
    }
    load()
    return () => { ignore = true }
  }, [wid, setCatalog])

  /* ---------- sync selection to global store ---------- */
  useEffect(() => {
    if (selectedVideoId === AUTO) {
      setPlaybackAll()
    } else if (selectedVideoId) {
      setPlaybackVideo(selectedVideoId)
    }
  }, [selectedVideoId, setPlaybackAll, setPlaybackVideo])

  /* ---------- fetch preview on selection (skip when Auto) ---------- */
  useEffect(() => {
    async function run() {
      setPreviewUrl(null)
      setResolution({ w: null, h: null })
      setDuration(0)
      setCurrentTime(0)
      setIsPlaying(false)
      setPreviewTries(0)

      if (!wid || !selectedVideoId || selectedVideoId === AUTO) return

      // cached?
      const cached = previewCacheRef.current[selectedVideoId]
      if (cached) {
        setPreviewUrl(cached)
        return
      }

      try {
        setLoadingPreview(true)
        const url = await getPreviewUrl(wid, selectedVideoId)
        if (!url) {
          console.warn("[player:url] missing url for", selectedVideoId)
          setPreviewUrl(null)
          return
        }
        previewCacheRef.current[selectedVideoId] = url
        setPreviewUrl(url)
        if (process.env.NODE_ENV !== "production") {
          console.log("[player:url] ready for", selectedVideoId)
        }
      } catch (e) {
        console.warn("[player:url] failed:", e?.message || e)
        setPreviewUrl(null)
      } finally {
        setLoadingPreview(false)
      }
    }
    run()
  }, [wid, selectedVideoId])

  /* ---------- track time + duration from element ---------- */
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onTime = () => setCurrentTime(v.currentTime || 0)
    const onMeta = () => {
      setDuration(v.duration || 0)
      setResolution({ w: v.videoWidth || null, h: v.videoHeight || null })
    }
    v.addEventListener("timeupdate", onTime)
    v.addEventListener("loadedmetadata", onMeta)
    // initialize immediately in case events already fired
    onMeta()
    onTime()
    return () => {
      v.removeEventListener("timeupdate", onTime)
      v.removeEventListener("loadedmetadata", onMeta)
    }
  }, [previewUrl]) // new source → re-bind

  /* ---------- respond to player seek requests ---------- */
  useEffect(() => {
    const req = playerSeekRequest
    if (!req) return

    // if not on the right video, switch selection first
    if (selectedVideoId !== req.videoId) {
      setSelectedVideoId(req.videoId)
      setPlaybackVideo(req.videoId)
      // Defer actual seek until metadata is loaded. We'll try again when previewUrl updates.
      return
    }

    const v = videoRef.current
    if (v && !Number.isNaN(req.ms)) {
      const doSeek = () => {
        v.currentTime = Math.max(0, req.ms / 1000)
        if (req.autoplay) v.play().catch(() => {})
        clearPlayerSeekRequest()
        v.removeEventListener("loadedmetadata", doSeek)
        v.removeEventListener("canplay", doSeek)
      }

      // If metadata available, seek now; otherwise wait for events.
      if (v.readyState >= 1) doSeek()
      else {
        v.addEventListener("loadedmetadata", doSeek)
        v.addEventListener("canplay", doSeek)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerSeekRequest, selectedVideoId, previewUrl])

  /* ---------- controls ---------- */
  const handlePlay = () => { videoRef.current?.play(); setIsPlaying(true) }
  const handlePause = () => { videoRef.current?.pause(); setIsPlaying(false) }

  const handlePrevFrame = () => {
    const v = videoRef.current; if (!v) return
    v.pause(); setIsPlaying(false)
    v.currentTime = Math.max((v.currentTime || 0) - 1 / 24, 0)
  }
  const handleNextFrame = () => {
    const v = videoRef.current; if (!v) return
    v.pause(); setIsPlaying(false)
    v.currentTime = (v.currentTime || 0) + 1 / 24
  }

  const handlePrevVideo = () => {
    if (selectedIndex <= 0) return
    setSelectedVideoId(sortedVideos[selectedIndex - 1].id)
    setIsPlaying(false)
  }
  const handleNextVideo = () => {
    if (selectedIndex < 0 || selectedIndex >= sortedVideos.length - 1) return
    setSelectedVideoId(sortedVideos[selectedIndex + 1].id)
    setIsPlaying(false)
  }

  const handleTimeInput = () => {
    const [hh, mm, ss] = (inputTime || "00:00:00").split(":").map(Number)
    const newTime = (hh * 3600) + (mm * 60) + (ss || 0)
    if (!Number.isNaN(newTime) && videoRef.current) {
      videoRef.current.currentTime = Math.min(Math.max(newTime, 0), duration || newTime)
      setCurrentTime(videoRef.current.currentTime)
    }
    setIsEditingTime(false)
  }

  /* ---------- render ---------- */
  const hasVideos = sortedVideos.length > 0
  const isAuto = selectedVideoId === AUTO
  const displayRes = (resolution.w && resolution.h) ? `${resolution.w} × ${resolution.h}` : "—"

  // Compose label: "CAMx | Camera Label"
  const selectedLabel = isAuto
    ? "Auto"
    : [
        selectedVideo?.camera_code || "",
        selectedVideo?.camera_label || selectedVideo?.file_name || "",
      ].filter(Boolean).join(" | ") || (selectedVideo?.file_name || "—")

  return (
    <div className="w-full h-full flex flex-col p-8 items-center">
      {/* Top bar */}
      <div className="h-12 w-full rounded-md border border-neutral-700 mb-4 px-4 flex items-center justify-between">
        <div className="w-64 h-8 px-4 gap-4 flex flex-row items-center justify-start">
          <img src="/icons/video.svg" alt="Video" className="w-4 h-4" />

          <Select
            value={selectedVideoId || ""}
            onValueChange={(val) => setSelectedVideoId(val)}
            disabled={!hasVideos}
          >
            <SelectTrigger className="min-w-48 h-8 text-xs px-1 py-2">
              <SelectValue placeholder={hasVideos ? "Select video…" : "No videos"} />
            </SelectTrigger>
            <SelectContent>
              {/* Auto is first */}
              <SelectItem value={AUTO} className="text-xs">
                Auto
              </SelectItem>
              {sortedVideos.map((v) => {
                const labelLeft = v?.camera_code || ""
                const labelRight = v?.camera_label || v?.file_name || v?.id?.slice(0, 8) || ""
                const composed = [labelLeft, labelRight].filter(Boolean).join(" | ")
                return (
                  <SelectItem key={v.id} value={v.id} className="text-xs">
                    {composed || (v.file_name || v.camera_label || v.id.slice(0, 8))}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="w-64 h-8 px-4 flex flex-row items-center justify-center">
          <p
            className="text-xs text-white truncate"
            // Make the title deterministic during SSR (no locale formatting)
            title={isAuto ? "All videos (Auto)" : selectedLabel}
            suppressHydrationWarning
          >
            {selectedLabel}
            {!isAuto && selectedVideo?.recorded_at ? (
              <span suppressHydrationWarning>
                {isMounted ? ` • ${fmtHuman(selectedVideo.recorded_at)}` : ""}
              </span>
            ) : null}
          </p>
        </div>


        <div className="w-64 h-8 px-4 gap-2 flex flex-row items-center justify-end">
          <img src="/icons/hd.svg" alt="Resolution" className="w-4 h-4" />
          <p className="text-xs text-muted-foreground">{displayRes}</p>
        </div>
      </div>

      {/* Player */}
      <div className="h-[80%] w-auto rounded-xl overflow-hidden bg-black flex items-center justify-center">
        {!hasVideos ? (
          <div className="text-xs text-neutral-400">No videos in this workspace.</div>
        ) : isAuto ? (
          <div className="text-xs text-neutral-400">No playback (All workspace)</div>
        ) : previewUrl ? (
          <video
            ref={videoRef}
            key={previewUrl} // force reload when URL changes
            src={previewUrl}
            className="h-full w-auto object-contain rounded-xl"
            controls={false}
            preload="metadata"
            playsInline
            onLoadedMetadata={(e) => {
              const dur = e.currentTarget.duration || 0
              setDuration(dur)
              setResolution({ w: e.currentTarget.videoWidth || null, h: e.currentTarget.videoHeight || null })
              // NEW: publish duration so jumps can clamp within range
              if (wid && selectedVideoId) {
                useAppStore.getState().updateVideoMeta(wid, selectedVideoId, { durationSec: dur })
              }
            }}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime || 0)}
            onError={() => {
              // attempt one refresh if URL expired
              if (previewTries < 1 && wid && selectedVideoId) {
                setPreviewTries((n) => n + 1)
                // bust cache and refetch
                delete previewCacheRef.current[selectedVideoId]
                getPreviewUrl(wid, selectedVideoId)
                  .then((url) => {
                    if (url) {
                      previewCacheRef.current[selectedVideoId] = url
                      setPreviewUrl(url)
                    }
                  })
                  .catch(() => {})
              }
            }}
          />
        ) : (
          <div className="text-xs text-neutral-400">{loadingPreview ? "Loading preview…" : "No preview available."}</div>
        )}
      </div>

      {/* Transport */}
      <div className="w-full mt-4 flex items-center gap-4 px-4">
        {isEditingTime ? (
          <input
            type="text"
            value={inputTime}
            onChange={(e) => setInputTime(e.target.value)}
            onBlur={handleTimeInput}
            onKeyDown={(e) => e.key === "Enter" && handleTimeInput()}
            className="bg-neutral-800 text-white rounded px-2 py-0.5 w-[72px] text-sm text-center"
          />
        ) : (
          <span
            onClick={() => {
              setInputTime(formatTime(currentTime))
              setIsEditingTime(true)
            }}
            className="text-sm text-orange-500 cursor-pointer tabular-nums w-[72px] text-center"
          >
            {formatTime(currentTime)}
          </span>
        )}

        <input
          type="range"
          min={0}
          max={duration || 0}
          value={Math.min(currentTime, duration || 0)}
          onChange={(e) => {
            const newTime = parseFloat(e.target.value)
            setCurrentTime(newTime)
            if (videoRef.current) videoRef.current.currentTime = newTime
          }}
          disabled={!previewUrl}
          className="flex-1 accent-orange-500 h-1 rounded-lg appearance-none bg-neutral-700"
        />

        <span className="text-sm text-white tabular-nums w-[72px] text-center">
          {formatTime(duration)}
        </span>
      </div>

      <div className="w-full h-[10%] mt-4 flex items-center justify-center gap-4 bg-neutral-900 rounded-sm px-6">
        <button onClick={handlePrevVideo} disabled={!hasVideos || selectedIndex <= 0} className="p-3 rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40">
          <img src="/icons/prev.svg" alt="Previous Video" className="w-5 h-5" />
        </button>
        <button onClick={handlePrevFrame} disabled={!previewUrl} className="p-3 rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40">
          <img src="/icons/prevframe.svg" alt="Previous Frame" className="w-5 h-5" />
        </button>
        {isPlaying ? (
          <button onClick={handlePause} disabled={!previewUrl} className="p-3 rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40">
            <img src="/icons/pause.svg" alt="Pause" className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={handlePlay} disabled={!previewUrl} className="p-3 rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40">
            <img src="/icons/play.svg" alt="Play" className="w-5 h-5" />
          </button>
        )}
        <button onClick={handleNextFrame} disabled={!previewUrl} className="p-3 rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40">
          <img src="/icons/nextframe.svg" alt="Next Frame" className="w-5 h-5" />
        </button>
        <button onClick={handleNextVideo} disabled={!hasVideos || selectedIndex === sortedVideos.length - 1} className="p-3 rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40">
          <img src="/icons/next.svg" alt="Next Video" className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
