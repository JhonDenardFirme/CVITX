// components/modules/DetectionCounter.jsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { Separator } from "../ui/separator"
import { useAppStore } from "@/lib/store"
import { isValidVideoId } from "@/lib/videoAnalysis"

/* ---------------- time & formatting helpers ---------------- */

function formatTimeOfDay(value) {
  if (!value) return "-"
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })
}

function formatDateOnly(value) {
  if (!value) return "-"
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleDateString([], {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatDuration(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "-"

  const total = Math.floor(sec)
  const hours = Math.floor(total / 3600)
  const mins = Math.floor((total % 3600) / 60)
  const secs = total % 60

  if (hours > 0) {
    return `${hours}h ${mins}m ${secs}s`
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`
  }
  return `${secs}s`
}

/* ---------------- component ---------------- */

export default function DetectionCounter() {
  const params = useParams()
  const widFromParams = params?.workspaceId

  const currentWorkspace = useAppStore((s) => s.currentWorkspace)
  const workspaces = useAppStore((s) => s.workspaces)
  const playbackMode = useAppStore((s) => s.playbackMode)
  const playbackSelectedVideoId = useAppStore((s) => s.playbackSelectedVideoId)
  const videoCatalog = useAppStore((s) => s.videoCatalog)

  const wid =
    currentWorkspace?.id ||
    (typeof widFromParams === "string" ? widFromParams : null)

  const [totalDetections, setTotalDetections] = useState(null) // null = not loaded yet
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Workspace label (we might show this subtly in the footer later if needed)
  const workspaceMeta = useMemo(() => {
    const id = wid
    if (!id) return { code: "-", title: "-" }
    const fromStore =
      currentWorkspace?.id === id
        ? currentWorkspace
        : Array.isArray(workspaces)
        ? workspaces.find((w) => w.id === id)
        : null

    const code = (fromStore?.code || fromStore?.workspace_code || "-") || "-"
    const title = (fromStore?.title || "-") || "-"
    return { code, title }
  }, [wid, currentWorkspace, workspaces])

  // Stable, validated video id for "video" scope; null otherwise
  const safeVideoId = useMemo(() => {
    if (playbackMode !== "video") return null
    if (!isValidVideoId(playbackSelectedVideoId)) return null
    return String(playbackSelectedVideoId).trim()
  }, [playbackMode, playbackSelectedVideoId])

  // Video metadata from global catalog (if available)
  const catalogForWid = wid ? videoCatalog?.[wid] || {} : {}
  const videoMeta = safeVideoId ? catalogForWid[safeVideoId] || null : null

  const hasSpecificVideo =
    playbackMode === "video" && !!safeVideoId && !!videoMeta

  // Derived display fields
  const videoLabel = hasSpecificVideo
    ? videoMeta.file_name || videoMeta.title || safeVideoId
    : "-"

  const cameraLabel = hasSpecificVideo
    ? (() => {
        const code = videoMeta.camera_code || ""
        if (code) return `${code}`
        if (code) return code
        return "-"
      })()
    : "-"

  const cameraCode = hasSpecificVideo
    ? videoMeta.camera_code || "—"
    : workspaceMeta.code || "—"

  const recordedAt = hasSpecificVideo ? videoMeta.recorded_at || null : null
  const durationSec =
    hasSpecificVideo && Number.isFinite(videoMeta?.durationSec)
      ? Number(videoMeta.durationSec)
      : null

  const startTimeLabel =
    hasSpecificVideo && recordedAt ? formatTimeOfDay(recordedAt) : "-"

  const endTimeLabel =
    hasSpecificVideo && recordedAt && Number.isFinite(durationSec)
      ? (() => {
          const start = new Date(recordedAt)
          if (Number.isNaN(start.getTime())) return "-"
          const end = new Date(start.getTime() + durationSec * 1000)
          return formatTimeOfDay(end)
        })()
      : "-"

  const dateLabel =
    hasSpecificVideo && recordedAt ? formatDateOnly(recordedAt) : "-"

  const durationLabel =
    hasSpecificVideo && Number.isFinite(durationSec)
      ? formatDuration(durationSec)
      : "-"

  const scopeLabel =
    playbackMode === "video" && safeVideoId
      ? "Scope: Selected video"
      : "Scope: All videos in workspace"

  // Fetch detection counts in the same way IndexingRecords decides scope
  useEffect(() => {
    let cancelled = false

    async function loadCount() {
      if (!wid) {
        setTotalDetections(null)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      try {
        let total = 0

        if (playbackMode === "video" && safeVideoId) {
          // Video-scoped detections for the selected video
          const res = await fetch(
            `/api/workspaces/${wid}/videos/${safeVideoId}/detections?variant=cmt`,
            { cache: "no-store" }
          )

          if (res.ok) {
            const data = await res.json()
            const items = Array.isArray(data.items) ? data.items : []
            total = items.length
          } else if (res.status === 404) {
            // No detections yet for this video → treat as zero
            total = 0
          } else {
            const text = await res.text()
            let detail = "Failed to load detection count."
            try {
              const j = text ? JSON.parse(text) : null
              detail =
                j?.error?.message || j?.message || j?.detail || detail
            } catch {
              // ignore parse errors
            }
            throw new Error(detail)
          }
        } else {
          // Workspace-scoped detections (All mode)
          const res = await fetch(
            `/api/workspaces/${wid}/detections?variant=cmt`,
            { cache: "no-store" }
          )

          if (res.ok) {
            const data = await res.json()
            const items = Array.isArray(data.items) ? data.items : []
            total = items.length
          } else if (res.status === 404) {
            total = 0
          } else {
            const text = await res.text()
            let detail = "Failed to load detection count."
            try {
              const j = text ? JSON.parse(text) : null
              detail =
                j?.error?.message || j?.message || j?.detail || detail
            } catch {
              // ignore parse errors
            }
            throw new Error(detail)
          }
        }

        if (!cancelled) {
          setTotalDetections(total)
        }
      } catch (err) {
        console.error("[DetectionCounter] loadCount error:", err)
        if (!cancelled) {
          setTotalDetections(null)
          setError(
            err && typeof err.message === "string" && err.message.length > 0
              ? err.message
              : "Failed to load detection count."
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadCount()

    return () => {
      cancelled = true
    }
  }, [wid, playbackMode, safeVideoId])

  const totalLabel = (() => {
    if (!wid) return "-"
    if (loading && totalDetections === null) return "…"
    if (totalDetections === null) return error ? "-" : "0"
    return String(totalDetections)
  })()

  const cameraNameDisplay =
    playbackMode === "video"
      ? cameraLabel && cameraLabel !== "-"
        ? cameraLabel
        : "- <CAMERA NAME> -"
      : "- ALL VIDEOS IN WORKSPACE -"

  const cameraIsActive =
    playbackMode === "video" && cameraLabel && cameraLabel !== "-"

  const categorizedLabel = totalLabel === "-" ? "0" : totalLabel
  const uncategorizedLabel = "0"

  const displayDate =
    dateLabel !== "-" ? dateLabel : formatDateOnly(new Date())

  return (
    <div className="w-full h-full flex flex-col p-8 items-start justify-start overflow-y-auto scrollbar-none gap-4">
      {/* Header */}
      <div className="h-10 w-full rounded-md border border-neutral-700 px-4 flex items-center justify-center gap-2 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/detection.svg" className="w-4 h-4" alt="Detection" />
        <p className="text-xs text-white">Detection Counter</p>
      </div>

      {/* TOTAL DETECTIONS */}
      <div className="w-full flex-1 flex flex-col items-center justify-center rounded-md border border-neutral-700 p-4 shrink-0">
        <p className="text-6xl font-bold tabular-nums">{totalLabel}</p>
        <p className="text-xs mb-4">Vehicles Detected</p>


        <Separator />

        <div className="flex flex-col mt-4 items-center w-full">
          <div className="flex flex-row gap-1.5 items-center justify-center w-full">
            <div className="max-w-[80%] truncate text-xs text-white">
              {cameraNameDisplay}
            </div>
            <div
              className={`rounded-full w-2 h-2 mb-0.5 ${
                cameraIsActive ? "bg-green-500" : "bg-red-500"
              }`}
            />
          </div>
          <p className="text-xs text-neutral-500">
            {playbackMode === "video" ? "Source Feed" : "Workspace Scope"}
          </p>
        </div>

        {error && (
          <p className="mt-3 text-[11px] text-red-400 text-center max-w-xs">
            {error}
          </p>
        )}
      </div>

      {/* Video / Camera Summary */}
      <div className="w-full flex-2 flex flex-col items-center justify-center rounded-md border border-neutral-700 p-4 shrink-0">
        <Separator />

        <div className="flex flex-col gap-2 items-center justify-center my-4">
          <p className="text-4xl font-bold">
            {cameraCode && cameraCode !== "-" ? cameraCode : "—"}
          </p>
          <p className="text-xs -mt-3 text-sky-500 font-light">
            {playbackMode === "video" ? videoLabel : workspaceMeta.title}
          </p>

        </div>

        <Separator />

        <div className="flex flex-row mt-4 w-full items-center justify-between">
          <div className="flex-1 flex flex-col gap-2 items-center justify-center">
            <p className="text-4xl font-bold tabular-nums">
              {categorizedLabel}
            </p>
            <p className="text-xs -mt-3 text-green-500 font-light">
              Categorized
            </p>
          </div>

          <Separator orientation="vertical" />

          <div className="flex-1 flex flex-col gap-2 items-center justify-center">
            <p className="text-4xl font-bold tabular-nums">
              {uncategorizedLabel}
            </p>
            <p className="text-xs -mt-3 text-red-500 font-light">
              Uncategorized
            </p>
          </div>
        </div>

        <Separator className="m-4" />

        <div className="flex flex-col items-center justify-center gap-1">

          <p className="text-xs text-neutral-300 mt-1">
            {hasSpecificVideo
              ? `${startTimeLabel} · ${endTimeLabel}`
              : "-"}
          </p>
        </div>

        <Separator className="m-4" />

        <div className="flex flex-col items-center justify-center gap-1">
          <p className="text-xs text-neutral-500">{displayDate}</p>
        </div>

        <Separator className="mt-4" />
      </div>
    </div>
  )
}
