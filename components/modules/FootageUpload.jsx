// components/modules/FootageUpload.jsx
"use client"

/*
  FootageUpload.jsx
  -----------------
  Purpose:
    Frontend module for uploading CCTV footage to a workspace, listing videos,
    editing allowed metadata while status=uploaded, enqueueing analysis, and
    showing per-video progress.

  Aligned API (via Next.js /api proxy):
    GET    /api/workspaces/:wid/videos
    POST   /api/workspaces/:wid/videos/presign             -> VideoPresignIn
    POST   /api/workspaces/:wid/videos/commit              -> VideoCommitIn (creates/updates `videos` row)
    PATCH  /api/workspaces/:wid/videos/:vid                -> edits row (cameraLabel, recordedAt only)
    DELETE /api/workspaces/:wid/videos/:vid                -> deletes row (requires {confirmCameraCode})
    POST   /api/workspaces/:wid/videos/:vid/enqueue        -> queue analysis (PROCESS_VIDEO)
    GET    /api/workspaces/:wid/videos/:vid/progress       -> VideoProgressOut (status, counts, percent)
    GET    /api/workspaces/:wid/videos/:vid/url            -> short-lived signed GET URL for preview

  Canonical flow:
    1) Presign upload for the selected MP4 (content-type must match) via /videos/presign
       → returns { videoId, s3KeyRaw, presignedUrl, ... }
    2) PUT the file to S3 using the returned presignedUrl
    3) Commit the upload with a JSON body (see handleSubmit) — backend writes/updates `videos` row
    4) Enqueue analysis for a video in 'uploaded' status
    5) Poll status globally and per-video progress via /videos/:vid/progress

  Notes:
    - recordedAt is sent as ISO-8601 (UTC) derived from <input type="datetime-local">
    - Preview uses a short-lived signed GET URL fetched per card (auto-retries once on error)
    - Editing is only allowed while status === "uploaded"
    - Camera Code is set at creation (presign + commit) and is immutable afterwards (display-only in the card)
*/

import React, { useEffect, useMemo, useState } from "react"
import { HardDriveUpload, UploadIcon, Film, EllipsisVertical } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileUpload } from "@/components/ui/file-upload"

import { useParams } from "next/navigation"
import { useAppStore } from "@/lib/store"

/* ---------------- helpers ---------------- */

// FE-owned camera code rules (for creation only):
// - Must start with "CAM-"
// - Uppercase
// - Allowed chars after prefix: A–Z, 0–9, and hyphen
// - Length <= 32
const CAMCODE_MAX = 32
function normalizeCameraCode(raw) {
  if (!raw) return ""
  let s = String(raw).toUpperCase().trim().replace(/\s+/g, "-")
  if (!s.startsWith("CAM-")) s = "CAM-" + s.replace(/^CAM-+/i, "")
  s = s.replace(/[^A-Z0-9-]/g, "")
  if (s.length > CAMCODE_MAX) s = s.slice(0, CAMCODE_MAX)
  return s
}
function isValidCameraCode(code) {
  if (!code) return false
  if (!code.startsWith("CAM-")) return false
  if (code.length > CAMCODE_MAX) return false
  if (code.length < 5) return false // require at least one char after CAM-
  return /^[A-Z0-9-]+$/.test(code)
}

// Numeric-aware sort for codes like "CAM-1", "CAM-10", "CAM-2"
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

// Convert <input type="datetime-local"> to ISO string (UTC)
function localDateTimeToISO(localValue) {
  if (!localValue) return null
  const d = new Date(localValue)
  return d.toISOString()
}
// ISO -> "yyyy-MM-ddTHH:mm" for datetime-local input
function isoToLocalInput(iso) {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Human-readable datetime like "Feb 22, 2025 | 12:30 PM"
function fmtHuman(dt) {
  if (!dt) return "—"
  const d = typeof dt === "string" ? new Date(dt) : dt
  const dPart = new Intl.DateTimeFormat(undefined, { month: "short", day: "2-digit", year: "numeric" }).format(d)
  const tPart = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(d)
  return `${dPart} | ${tPart}`
}

/* ---------------- shape normalizer ---------------- */

/**
 * Normalize backend VideoRowOut (camelCase or snake_case) into
 * a frontend-friendly snake_case shape used by this component.
 */
function normalizeVideoRow(raw) {
  if (!raw) return null
  return {
    id: raw.id,
    workspace_id: raw.workspaceId ?? raw.workspace_id,
    workspace_code: raw.workspaceCode ?? raw.workspace_code ?? null,
    file_name: raw.fileName ?? raw.file_name ?? "",
    camera_label: raw.cameraLabel ?? raw.camera_label ?? "",
    camera_code: raw.cameraCode ?? raw.camera_code ?? "",
    recorded_at: raw.recordedAt ?? raw.recorded_at ?? null,
    s3_key_raw: raw.s3KeyRaw ?? raw.s3_key_raw ?? "",
    frame_stride: raw.frameStride ?? raw.frame_stride ?? 3,
    status: raw.status ?? "uploaded",
    created_at: raw.createdAt ?? raw.created_at ?? null,
    updated_at: raw.updatedAt ?? raw.updated_at ?? null,
    error_msg: raw.errorMsg ?? raw.error_msg ?? null,
    processing_started_at:
      raw.processingStartedAt ?? raw.processing_started_at ?? null,
    processing_finished_at:
      raw.processingFinishedAt ?? raw.processing_finished_at ?? null,
  }
}

/* ---------------- API helpers (proxying via /api) ---------------- */

async function listVideos(wid) {
  const r = await fetch(`/api/workspaces/${wid}/videos`, { cache: "no-store" })
  if (!r.ok) throw new Error(await r.text())
  const data = await r.json()
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : []
  return items.map((v) => normalizeVideoRow(v)).filter(Boolean)
}

async function patchVideo(wid, vid, body) {
  const r = await fetch(`/api/workspaces/${wid}/videos/${vid}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(await r.text())
  const data = await r.json()
  const raw = data?.video ?? data
  return normalizeVideoRow(raw)
}

async function deleteVideo(wid, vid, confirmCameraCode) {
  const r = await fetch(`/api/workspaces/${wid}/videos/${vid}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmCameraCode }),
  })
  if (!r.ok) throw new Error(await r.text())
}

async function enqueueVideo(wid, vid) {
  const r = await fetch(`/api/workspaces/${wid}/videos/${vid}/enqueue`, { method: "POST" })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

// Video progress (counts + percent) for a given variant (default "cmt")
async function getVideoProgress(wid, vid, variant = "cmt") {
  const r = await fetch(
    `/api/workspaces/${wid}/videos/${vid}/progress?variant=${encodeURIComponent(variant)}`,
    { cache: "no-store" }
  )
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

// PUT the file to S3 using presigned URL (must match content-type used for presign)
async function putToS3(putUrl, file) {
  const res = await fetch(putUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "video/mp4" },
    body: file,
  })
  if (!res.ok) throw new Error("S3 upload failed")
}

// Get short-lived preview URL for video playback
async function getPreviewUrl(wid, vid) {
  const r = await fetch(`/api/workspaces/${wid}/videos/${vid}/url`, { cache: "no-store" })
  if (!r.ok) {
    const txt = await r.text().catch(() => "")
    throw new Error(`preview-url ${r.status}: ${txt || "failed"}`)
  }
  const j = await r.json()
  return j?.url || j?.signed_url || j?.href || null
}

/* ---------------- Main component ---------------- */

export default function FootageUpload() {
  // Resolve workspace id (store first, then /w/[workspaceId] param)
  const params = useParams()
  const widFromParams = params?.workspaceId
  const currentWorkspace = useAppStore((s) => s.currentWorkspace)
  const wid = currentWorkspace?.id || widFromParams || null

  // Videos state (real list → sorted by camera_code)
  const [videos, setVideos] = useState([])
  const sortedVideos = useMemo(() => [...videos].sort(sortByCameraCodeAsc), [videos])

  // Dialog / form state
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    fileName: "",          // -> file_name (used at commit only for initial set)
    cameraLabel: "",       // -> camera_label (also PATCH-able)
    cameraCode: "CAM-001", // -> camera_code (enforced at creation; immutable post-commit)
    recordedAtLocal: "",   // datetime-local (to ISO)
  })
  const [camErr, setCamErr] = useState("")

  // Load videos
  useEffect(() => {
    let ignore = false
    async function load() {
      if (!wid) return
      try {
        const arr = await listVideos(wid)
        if (ignore) return

        console.groupCollapsed(`[videos:list] wid=${wid}`)
        console.log(`count: ${arr.length}`)
        if (arr.length) {
          console.table(
            arr.map((v) => ({
              id: v.id,
              file_name: v.file_name,
              camera_code: v.camera_code,
              camera_label: v.camera_label,
              status: v.status,
              recorded_at: v.recorded_at,
            }))
          )
        }
        console.groupEnd()

        setVideos(arr)
      } catch (e) {
        console.error("[videos:list] failed:", e)
        setVideos([])
        toast.error("Failed to load videos")
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [wid])

  const resetForm = () => {
    setFiles([])
    setForm({ fileName: "", cameraLabel: "", cameraCode: "CAM-001", recordedAtLocal: "" })
    setCamErr("")
  }

  async function refresh() {
    if (!wid) return
    try {
      const arr = await listVideos(wid)
      setVideos(arr)
    } catch (e) {
      console.warn("[videos:refresh] failed:", e)
    }
  }

  // Poll while any queued/processing (global list refresh)
  useEffect(() => {
    if (!wid) return
    const anyPending = videos.some((v) => v.status === "queued" || v.status === "processing")
    if (!anyPending) return
    const t = setInterval(() => {
      refresh().catch(() => {})
    }, 12000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wid, videos])

  // Create flow: presign → PUT → commit → refresh (backend writes videos row on commit)
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!wid) {
      toast.error("Workspace not set. Reload the workspace page.")
      return
    }
    if (files.length !== 1) {
      toast.error("Attach exactly one .mp4 file.")
      return
    }

    const file = files[0]
    const isMp4 = file?.type === "video/mp4" || file?.name?.toLowerCase().endsWith(".mp4")
    if (!isMp4) {
      toast.error("Only .mp4 files are allowed.")
      return
    }

    const file_name = form.fileName?.trim() || file.name
    const recorded_at = localDateTimeToISO(form.recordedAtLocal)
    const camera_label = form.cameraLabel?.trim() || null
    const camera_code = normalizeCameraCode(form.cameraCode)
    if (!recorded_at) {
      toast.error("Please set the 'Recorded at' date/time.")
      return
    }
    if (!isValidCameraCode(camera_code)) {
      setCamErr("Camera code must start with 'CAM-' and contain A–Z, 0–9, or '-' only.")
      toast.error("Invalid camera code")
      return
    }

    setUploading(true)
    try {
      // 1) presign → /videos/presign (VideoPresignIn)
      const presignRes = await fetch(`/api/workspaces/${wid}/videos/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type || "video/mp4",
          file_size_bytes: file.size,
          camera_code, // normalized above
          frame_stride: 3,
          recorded_at: recorded_at,
          workspace_code: currentWorkspace?.code || null,
        }),
      })
      if (!presignRes.ok) throw new Error(await presignRes.text())
      const presigned = await presignRes.json()
      const video_id =
        presigned?.videoId ?? presigned?.video_id ?? presigned?.id ?? null
      const key =
        presigned?.s3KeyRaw ?? presigned?.s3_key_raw ?? presigned?.key ?? null
      const putUrl =
        presigned?.presignedUrl ?? presigned?.url ?? presigned?.put_url ?? null
      if (!video_id || !key || !putUrl) {
        throw new Error(
          "Presign missing required fields (videoId/s3KeyRaw/presignedUrl)"
        )
      }
      console.log("[videos:create] presigned", { video_id, key })

      // 2) upload
      await putToS3(putUrl, file)

      // 3) commit — backend requires JSON body (no query params)
      const commitBody = {
        videoId: video_id,
        s3KeyRaw: key,
        fileName: file_name,
        frameStride: 3,
        recordedAt: recorded_at,
        cameraCode: camera_code,
        cameraLabel: camera_label,
        workspaceCode: currentWorkspace?.code || null,
        fileSizeBytes: file.size,
        contentType: file.type || "video/mp4",
      }
      const commitRes = await fetch(`/api/workspaces/${wid}/videos/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commitBody),
      })
      if (!commitRes.ok) throw new Error(await commitRes.text())

      // 4) backend wrote/updated the row on /videos/commit → refresh list
      await refresh()

      setOpen(false)
      resetForm()
      toast.success("Upload successful")
    } catch (err) {
      console.error(err)
      toast.error(`Upload failed: ${err?.message || err}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col p-8 items-start justify-start">
      {/* Header */}
      <div className="flex flex-row items-center mb-4 w-full justify-between">
        <div className="flex flex-row gap-4 items-center">
          <HardDriveUpload size={20} />
          <div className="h-6 w-[1px] border-[1px] border-neutral-800" />
          <p className="text-md">Footage Upload</p>
        </div>

        {/* Upload dialog */}
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o)
            if (!o) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <button className="text-sm px-4 py-2 gap-2 bg-orange-500 text-white rounded-md hover:bg-orange-400 flex flex-row items-center justify-center">
              <UploadIcon size={14} />
              Upload Footage
            </button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[720px] h-[80%] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-5">
              <DialogHeader>
                <DialogTitle>Upload Footage</DialogTitle>
                <DialogDescription>
                  Fill in the details, then attach your footage at the bottom.
                </DialogDescription>
              </DialogHeader>

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* file_name */}
                <div className="grid gap-2">
                  <Label htmlFor="f-name">File Name</Label>
                  <Input
                    id="f-name"
                    placeholder="ex. CCTV Road 1"
                    value={form.fileName}
                    onChange={(e) => setForm((s) => ({ ...s, fileName: e.target.value }))}
                  />
                </div>

                {/* camera_label */}
                <div className="grid gap-2">
                  <Label htmlFor="f-label">Camera Description</Label>
                  <Input
                    id="f-label"
                    placeholder="ex. Anonas Street – West Gate"
                    value={form.cameraLabel}
                    onChange={(e) => setForm((s) => ({ ...s, cameraLabel: e.target.value }))}
                  />
                </div>

                {/* camera_code (creation-time only; enforced here) */}
                <div className="grid gap-2">
                  <Label htmlFor="f-code">Camera Code</Label>
                  <Input
                    id="f-code"
                    placeholder="CAM-001"
                    value={form.cameraCode}
                    onChange={(e) => {
                      const norm = normalizeCameraCode(e.target.value)
                      setForm((s) => ({ ...s, cameraCode: norm }))
                      setCamErr(
                        isValidCameraCode(norm) ? "" : "Must start with 'CAM-' and use A–Z, 0–9, or '-'"
                      )
                    }}
                  />
                  {camErr ? (
                    <p className="text-xs text-red-400">{camErr}</p>
                  ) : (
                    <p className="text-xs text-neutral-500">
                      FE-enforced. Must start with <span className="font-mono">CAM-</span>.
                    </p>
                  )}
                </div>

                {/* recorded_at */}
                <div className="grid gap-2">
                  <Label htmlFor="f-recorded">Recorded At</Label>
                  <Input
                    id="f-recorded"
                    type="datetime-local"
                    value={form.recordedAtLocal}
                    onChange={(e) => setForm((s) => ({ ...s, recordedAtLocal: e.target.value }))}
                  />
                  <p className="text-xs text-neutral-500">Please input the actual time the video was recorded.</p>
                </div>
              </div>

              {/* File Upload */}
              <div className="grid gap-2">
                <Label>Footage File</Label>
                <div className="w-full min-h-40 border border-dashed bg-white/0 dark:bg-black border-neutral-700 rounded-lg">
                  <FileUpload
                    accept="video/mp4"
                    multiple={false}
                    maxFiles={1}
                    onChange={(incoming) => {
                      const arr = Array.isArray(incoming) ? incoming : incoming ? [incoming] : []
                      const first = arr[0]
                      if (!first) return setFiles([])

                      const isMp4_ = first.type === "video/mp4" || first.name?.toLowerCase().endsWith(".mp4")
                      if (!isMp4_) {
                        setFiles([])
                        toast.error("Only .mp4 files are allowed.")
                        return
                      }
                      setFiles([first])
                      // Prefill fileName from chosen file if empty
                      setForm((s) => (s.fileName ? s : { ...s, fileName: first.name }))
                    }}
                  />
                </div>
                <p className="text-xs text-neutral-400">Only one MP4 file is allowed. Drag & drop is supported.</p>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" type="button" disabled={uploading}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  disabled={
                    !wid ||
                    !files.length ||
                    !form.recordedAtLocal ||
                    !isValidCameraCode(normalizeCameraCode(form.cameraCode)) ||
                    uploading
                  }
                >
                  {uploading ? "Uploading..." : "Save & Upload"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="h-[1px] w-full border-[1px] border-neutral-800 mt-2 mb-8" />

      {/* Video grid (sorted by camera_code) */}
      <div className="h-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedVideos.length === 0 && (
          <div className="w-full text-xs text-neutral-400 mb-4">No videos found for this workspace.</div>
        )}

        {sortedVideos.map((v) => (
          <VideoCard
            key={v.id}
            wid={wid}
            v={v}
            onChange={(updated) => setVideos((list) => list.map((x) => (x.id === updated.id ? updated : x)))}
            onRemove={(vid) => setVideos((list) => list.filter((x) => x.id !== vid))}
            refreshAll={refresh}
          />
        ))}
      </div>
    </div>
  )
}

/* ---------------- Per-card (edit / delete / analyze) ---------------- */

function VideoCard({ wid, v, onChange, onRemove, refreshAll }) {
  const [open, setOpen] = useState(false)
  const [pendingAnalyze, setPendingAnalyze] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // preview url state (signed GET)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [previewTries, setPreviewTries] = useState(0) // retry once on error/expiry

  // progress state (per-video polling)
  const [progress, setProgress] = useState(null)

  // editable fields (only allowed in 'uploaded')
  const [fileName, setFileName] = useState(v.file_name || "")
  const [cameraLabel, setCameraLabel] = useState(v.camera_label || "")
  // cameraCode is immutable post-commit; display-only and used for delete confirm
  const [cameraCode] = useState(v.camera_code || "CAM-001")
  const [recordedAtLocal, setRecordedAtLocal] = useState(isoToLocalInput(v.recorded_at))

  useEffect(() => {
    // keep dialog fields in sync if v changes externally
    setFileName(v.file_name || "")
    setCameraLabel(v.camera_label || "")
    // cameraCode is intentionally NOT reassignable by user (immutable)
    setRecordedAtLocal(isoToLocalInput(v.recorded_at))
  }, [v.id, v.file_name, v.camera_label, v.recorded_at])

  async function loadPreview() {
    if (!wid || !v?.id) return
    try {
      setLoadingPreview(true)
      const url = await getPreviewUrl(wid, v.id)
      if (!url) {
        console.warn("[videos:url] missing url for", v.id)
        setPreviewUrl(null)
        return
      }
      setPreviewUrl(url)
      console.log("[videos:url] ready for", v.id)
    } catch (e) {
      console.warn("[videos:url] failed:", e?.message || e)
      setPreviewUrl(null)
    } finally {
      setLoadingPreview(false)
    }
  }

  // refetch preview on wid/vid change
  useEffect(() => {
    setPreviewUrl(null)
    setPreviewTries(0)
    loadPreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wid, v?.id])

  // Per-card progress polling while queued/processing
  useEffect(() => {
    if (!wid || !v?.id) return
    if (v.status !== "queued" && v.status !== "processing") {
      setProgress(null)
      return
    }

    let cancelled = false

    async function pollOnce() {
      try {
        const j = await getVideoProgress(wid, v.id)
        if (cancelled) return
        setProgress({
          status: j.status,
          percent: j.percent,
          expectedSnapshots: j.expectedSnapshots,
          processedSnapshots: j.processedSnapshots,
          processedOk: j.processedOk,
          processedErr: j.processedErr,
        })

        if ((j.status === "done" || j.status === "error") && typeof refreshAll === "function") {
          await refreshAll()
        }
      } catch (e) {
        if (!cancelled) {
          console.warn("[videos:progress] poll failed:", e?.message || e)
        }
      }
    }

    pollOnce()
    const id = setInterval(pollOnce, 5000)

    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [wid, v?.id, v.status, refreshAll])

  const canAnalyze = v.status === "uploaded" && !pendingAnalyze
  const canEdit = v.status === "uploaded"
  const confirmTarget = (cameraCode || "").trim()
  const [confirm, setConfirm] = useState("")

  async function doAnalyze() {
    try {
      setPendingAnalyze(true)
      console.log("[videos:enqueue] →", { wid, vid: v.id })
      const res = await enqueueVideo(wid, v.id)
      console.log("[videos:enqueue] response:", res)

      // Optimistic flip so pollers start immediately
      onChange({ ...v, status: "queued" })

      // Confirm refresh against backend truth
      if (typeof refreshAll === "function") {
        await refreshAll()
        console.log("[videos:enqueue] refreshAll() completed")
      }

      toast.success("Analyze queued", { description: v.file_name || v.id })
    } catch (e) {
      console.error(e)
      toast.error("Analyze enqueue failed", { description: String(e?.message || e) })
    } finally {
      setPendingAnalyze(false)
    }
  }

  async function doSave() {
    if (!canEdit) {
      toast.error("Only videos in 'uploaded' state can be edited.")
      return
    }
    try {
      setSaving(true)
      // Backend PATCH accepts only cameraLabel and recordedAt (camelCase)
      const payload = {
        cameraLabel: (cameraLabel || "").trim() || null,
        recordedAt: localDateTimeToISO(recordedAtLocal) || null,
      }
      console.log("[videos:patch] →", { wid, vid: v.id, payload })
      const updated = await patchVideo(wid, v.id, payload)
      onChange(updated)
      setOpen(false)
      toast.success("Saved changes")
    } catch (e) {
      console.error(e)
      toast.error(String(e?.message || e || "Failed to save changes"))
    } finally {
      setSaving(false)
    }
  }

  async function doDelete() {
    if (confirm.trim() !== confirmTarget) return
    try {
      setDeleting(true)
      console.log("[videos:delete] →", { wid, vid: v.id })
      await deleteVideo(wid, v.id, confirmTarget)
      onRemove(v.id)
      setOpen(false)
      toast.success("Video deleted")
    } catch (e) {
      console.error(e)
      toast.error(String(e?.message || e || "Failed to delete video"))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 bg-neutral-900 rounded-lg overflow-hidden relative border-[1px] border-white/20 p-4">
      {/* Top ribbon: camera_code + edit trigger */}
      <div className="absolute w-full h-8 top-4 left-0 flex flex-row justify-between items-center px-6 z-50">
        <div className="min-w-14 px-2 text-xs bg-black/75 rounded-sm text-center">
          {v.camera_code || "—"}
        </div>

        {/* Edit/Delete dialog trigger */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="min-w-4 px-2 py-0.5 text-xs bg-black/75 rounded-sm flex flex-row justify-center items-center">
              <EllipsisVertical size={10} />
            </button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Edit Video Details</DialogTitle>
              <DialogDescription>
                You can edit the file name, camera label, and recorded time while status is{" "}
                <span className="font-mono">uploaded</span>. Camera Code is immutable post-commit.
              </DialogDescription>
            </DialogHeader>

            {/* Edit form */}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor={`fn-${v.id}`}>File Name</Label>
                <Input
                  id={`fn-${v.id}`}
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  disabled={!canEdit}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`cl-${v.id}`}>Camera Label</Label>
                <Input
                  id={`cl-${v.id}`}
                  value={cameraLabel}
                  onChange={(e) => setCameraLabel(e.target.value)}
                  disabled={!canEdit}
                />
              </div>

              {/* Camera Code (display-only) */}
              <div className="grid gap-2">
                <Label>Camera Code</Label>
                <Input value={cameraCode} disabled />
                <p className="text-xs text-neutral-500">Immutable. Set during upload/commit.</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`rd-${v.id}`}>Recorded at</Label>
                <Input
                  id={`rd-${v.id}`}
                  type="datetime-local"
                  value={recordedAtLocal}
                  onChange={(e) => setRecordedAtLocal(e.target.value)}
                  disabled={!canEdit}
                />
              </div>
            </div>

            <DialogFooter className="justify-between gap-2 sm:justify-end">
              <DialogClose asChild>
                <Button variant="outline" disabled={saving || deleting}>
                  Close
                </Button>
              </DialogClose>
              <Button onClick={doSave} disabled={!canEdit || saving || deleting}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>

            {/* Danger zone */}
            <div className="mt-6 border-t border-neutral-800 pt-4">
              <p className="text-sm font-medium text-red-400 mb-2">Danger Zone</p>
              <p className="text-xs text-neutral-400 mb-3">
                To permanently delete this video, type the camera code{" "}
                <span className="font-semibold text-neutral-200">
                  {confirmTarget || "(no camera code)"}
                </span>{" "}
                below.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  placeholder={confirmTarget ? `Type ${confirmTarget}` : "No camera code set"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                <Button
                  variant="destructive"
                  disabled={!confirmTarget || confirm.trim() !== confirmTarget || deleting}
                  onClick={doDelete}
                >
                  {deleting ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Preview */}
      {previewUrl ? (
        <video
          key={previewUrl}
          src={previewUrl}
          controls
          preload="metadata"
          playsInline
          className="rounded-md w-full h-52 object-cover bg-black/40 border border-neutral-800"
          onError={() => {
            if (previewTries < 1) {
              setPreviewTries((n) => n + 1)
              loadPreview()
            } else {
              console.warn("[videos:url] preview failed after retry for", v.id)
            }
          }}
        />
      ) : (
        <div className="rounded-md w-full h-52 bg-black/40 border border-neutral-800 flex items-center justify-center">
          {loadingPreview ? (
            <span className="text-[11px] text-neutral-400">Loading preview…</span>
          ) : (
            <Film className="opacity-60" />
          )}
        </div>
      )}

      {/* Status pill */}
      <div className="mt-2">
        <span
          className={[
            "inline-block text-[10px] px-2 py-0.5 rounded-full border",
            v.status === "queued" && "border-yellow-500/60 text-yellow-400",
            v.status === "processing" && "border-blue-500/60 text-blue-400",
            v.status === "done" && "border-emerald-500/60 text-emerald-400",
            v.status === "error" && "border-red-500/60 text-red-400",
            !["queued", "processing", "done", "error"].includes(v.status) && "border-neutral-700 text-neutral-400",
          ]
            .filter(Boolean)
            .join(" ")}
          title={`Status: ${String(v.status || "-")}`}
        >
          {String(v.status || "-")}
        </span>
      </div>

      {/* Progress text */}
      {progress &&
        (v.status === "queued" || v.status === "processing") && (
          <div className="mt-1">
            <p className="text-[11px] text-neutral-400">
              Processing:{" "}
              {typeof progress.percent === "number" && Number.isFinite(progress.percent)
                ? `${progress.percent.toFixed(2)}%`
                : `${progress.percent}%`}{" "}
              {progress.expectedSnapshots
                ? `(${progress.processedSnapshots}/${progress.expectedSnapshots})`
                : `(${progress.processedSnapshots} snapshots)`}
            </p>
          </div>
        )}

      {/* Meta rows */}
      <div className="flex flex-col w-full justify-between items-center px-1">
        {/* row 1: filename + analyze */}
        <div className="flex flex-row w-full justify-between items-center gap-3">
          <p className="text-xs text-white truncate">{v.file_name || "—"}</p>
          <button
            type="button"
            disabled={!canAnalyze || pendingAnalyze}
            onClick={doAnalyze}
            className={`text-xs px-3 border-[1px] rounded-sm transition-all duration-300 ease-in-out ${
              canAnalyze && !pendingAnalyze
                ? "border-orange-500 hover:bg-orange-500 hover:cursor-pointer"
                : "opacity-50 cursor-not-allowed border-neutral-700"
            }`}
          >
            {pendingAnalyze ? "Queuing…" : v.status === "uploaded" ? "Analyze" : "Analyzing…"}
          </button>
        </div>

        <div className="w-full h-[1px] bg-white/30 my-2" />

        {/* row 2: camera_label | recorded_at */}
        <div className="flex flex-row w-full justify-between items-center gap-3">
          <p className="text-xs text-white/30 truncate max-w-[45%]">{v.camera_label || "—"}</p>
          <p className="text-xs text-white/30 truncate max-w-[45%] text-right">{fmtHuman(v.recorded_at)}</p>
        </div>
      </div>
    </div>
  )
}
