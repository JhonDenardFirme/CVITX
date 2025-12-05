// components/modules/IndexingRecords.jsx
"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useParams } from "next/navigation"
import { useAppStore } from "@/lib/store"

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"

import { toast } from "sonner"

import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

import {
  Check,
  ChevronDown,
  Download,
  EllipsisVertical,
  Loader2,
  Plus,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

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

import {
  vehicleTypes,
  vehicleColors,
  allVehicleMakes,
  allVehicleModels,
} from "@/lib/constants"

import VideoAnalysisDetailsDialog from "./VideoAnalysisDetailsDialog"

/* ---------------- options for popovers ---------------- */
const options = {
  type: vehicleTypes,
  color: vehicleColors,
  make: allVehicleMakes,
  model: allVehicleModels,
}

/* ---------------- helpers ---------------- */

// stable empty object to keep useSyncExternalStore snapshots referentially equal
const EMPTY_CATALOG = Object.freeze({})

function useIsMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  return mounted
}

/** CTX1004-CAM1-0002 -> CAM1-0002 */
function toCamDisplayId(value) {
  const s = String(value ?? "")
  const m = s.match(/(CAM[A-Za-z0-9-]+)/)
  return m ? m[1] : s
}

/** hh:mm:ss for rows (localized, client-only to avoid hydration mismatch) */
function fmtHMS(dateStr) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })
}

/** compute seek offset (ms from video start) using local catalog */
function computeSeekMs(det, videoMeta) {
  // 1) trust API if it is a sane, non-negative number
  if (Number.isFinite(det?.detected_in_ms) && det.detected_in_ms >= 0) {
    return det.detected_in_ms
  }

  // 2) derive from timestamps (timezone-safe epoch math)
  const detAt = Date.parse(det?.detected_at || "")
  const recAt = Date.parse(videoMeta?.recorded_at || "")
  let ms =
    Number.isFinite(detAt) && Number.isFinite(recAt)
      ? Math.max(0, detAt - recAt)
      : 0

  // 3) clamp to video duration if known
  const durMs = Number.isFinite(videoMeta?.durationSec)
    ? videoMeta.durationSec * 1000
    : null
  if (Number.isFinite(durMs)) {
    ms = Math.min(ms, Math.max(0, durMs))
  }
  return ms
}

/* ───────────────────────────────────────────────────────────────
   Filtering helpers (mirrored from ImageAnalysisTable)
   ─────────────────────────────────────────────────────────────── */

const p = (x) => (typeof x === "number" ? `${Math.round(x * 100)}%` : "—")
const toLower = (v) => String(v ?? "").toLowerCase()

// NULL helpers
const isNullish = (v) =>
  v === null || v === undefined || (typeof v === "string" && v.trim() === "")
const hasNullOption = (arr) => Array.isArray(arr) && arr.some((x) => x === "-")

// exact (case-insensitive) match OR NULL if "-" is selected
function matchesNullableExact(selected, value) {
  if (!selected?.length) return true
  const wantsNull = hasNullOption(selected)
  const wantsValues = selected.filter((x) => x !== "-")

  if (wantsNull && isNullish(value)) return true
  if (!wantsValues.length) return false

  return wantsValues.some((n) => toLower(n) === toLower(value))
}

// array-overlap for colors, with NULL support if "-" is selected
function matchesNullableColors(selected, values) {
  if (!selected?.length) return true
  const wantsNull = hasNullOption(selected)
  const wantsValues = selected.filter((x) => x !== "-")

  const hasColors = Array.isArray(values) && values.length > 0
  if (wantsNull && !hasColors) return true
  if (!wantsValues.length) return false

  const set = new Set((values || []).map((v) => toLower(v)))
  return wantsValues.some((n) => set.has(toLower(n)))
}

// trim MAKE_ prefix from "MAKE_MODEL" for display
function trimModelName(model) {
  if (!model) return ""
  const s = String(model)
  const idx = s.indexOf("_")
  return idx === -1 ? s : s.slice(idx + 1)
}

// model filter: support "-" (NULL), otherwise contains/equality against MAKE_MODEL
function matchesNullableModel(selectedModels, storedModel) {
  if (!selectedModels?.length) return true

  const wantsNull = hasNullOption(selectedModels)
  if (wantsNull && isNullish(storedModel)) return true

  const nonNullSelections = selectedModels.filter((x) => x !== "-")
  if (!nonNullSelections.length) return false

  const raw = String(storedModel || "")
  const rawL = raw.toLowerCase()
  const trimmedL = trimModelName(raw).toLowerCase()

  return nonNullSelections.some((sel) => {
    const s = toLower(sel)
    return rawL.includes(s) || trimmedL === s
  })
}

// render “label (conf)” with rules:
// - if value is null/empty → print "-" and do not print conf
// - if conf < 0.5 → gray out both label and conf
function renderLabelWithConf(label, conf) {
  const hasLabel = !isNullish(label)
  if (!hasLabel) return <span>-</span>
  const low = typeof conf === "number" && conf < 0.5

  return (
    <span className={low ? "text-neutral-700" : undefined}>
      {label}{" "}
      {typeof conf === "number" ? (
        <span
          className={`text-[10px] ${
            low ? "text-neutral-600" : "text-neutral-400"
          }`}
        >
          ({p(conf)})
        </span>
      ) : null}
    </span>
  )
}

/* =========================================================================
   Detection row normalization (DetectionOut → table-friendly shape)
   ========================================================================= */

function normalizeVideoDetectionRow(det, ctx) {
  const videoId = ctx?.videoId || det.videoId || null
  const vm = ctx?.videoMeta || {}
  const workspaceId = ctx?.workspaceId || vm.workspace_id || null

  const colorsArr = Array.isArray(det.colors)
    ? det.colors
        .map((c) =>
          c && c.base ? String(c.base).toUpperCase().trim() : ""
        )
        .filter(Boolean)
    : []

  const trackId =
    typeof det.trackId === "number"
      ? det.trackId
      : typeof det.track_id === "number"
      ? det.track_id
      : null

  const camCode = vm.camera_code || vm.cameraCode || ""
  const suffix =
    trackId !== null && trackId !== undefined
      ? String(trackId).padStart(4, "0")
      : String(det.id || "").slice(0, 8)

  const displayId =
    det.displayId ||
    det.display_id ||
    (camCode ? `${camCode}-${suffix}` : suffix)

  const detectedAt = det.detectedAt || det.detected_at || null
  const detectedInMsRaw =
    typeof det.detectedInMs === "number"
      ? det.detectedInMs
      : typeof det.detected_in_ms === "number"
      ? det.detected_in_ms
      : null

  const detectedInMs =
    Number.isFinite(detectedInMsRaw) && detectedInMsRaw >= 0
      ? detectedInMsRaw
      : null

  const assets = det.assets || {}

  const typeLabel =
    det.typeLabel ||
    det.type ||
    det.yoloType ||
    det.yolo_type ||
    ""

  const typeConf =
    typeof det.typeConf === "number"
      ? det.typeConf
      : typeof det.type_conf === "number"
      ? det.type_conf
      : null

  const makeLabel = det.makeLabel || det.make || ""

  const makeConf =
    typeof det.makeConf === "number"
      ? det.makeConf
      : typeof det.make_conf === "number"
      ? det.make_conf
      : null

  const modelLabel = det.modelLabel || det.model || ""

  const modelConf =
    typeof det.modelConf === "number"
      ? det.modelConf
      : typeof det.model_conf === "number"
      ? det.model_conf
      : null

  const plateText = det.plateText || det.plate_text || ""

  const snapshotUrlFromAssets =
    assets.vehicleUrl ||
    assets.annotatedUrl ||
    assets.vehicle_url ||
    assets.annotated_url ||
    null

  const snapshotUrl =
    det.snapshot_url ||
    det.snapshotUrl ||
    det.image ||
    det.snapshot ||
    snapshotUrlFromAssets

  return {
    id: det.id,
    detection_id: det.id,
    analysis_id: det.analysisId || det.analysis_id || null,
    run_id: det.runId || det.run_id || null,
    track_id: trackId,
    workspace_id: workspaceId,
    video_id: videoId || vm.id || vm.video_id || null,

    display_id: displayId,

    snapshot_url: snapshotUrl,
    plate_url: assets.plateUrl || null,

    type: typeLabel,
    type_conf: typeConf,

    make: makeLabel,
    make_conf: makeConf,

    model: modelLabel,
    model_conf: modelConf,

    plate_text: plateText,
    colors: colorsArr,

    detected_at: detectedAt,
    detected_in_ms: detectedInMs,
    recorded_at: vm.recorded_at || vm.recordedAt || null,

    video_title: vm.title || vm.file_name || vm.fileName || "",
    camera_code: vm.camera_code || vm.cameraCode || "",
    camera_label: vm.camera_label || vm.cameraLabel || "",
  }
}

/* =========================================================================
   Combined Edit + Danger Zone (single dialog styled like Workspace)
   ========================================================================= */

function EditDangerDialog({
  item,
  workspaceId,
  videoId,
  open,
  onOpenChange,
  onSaved,
  onDeleted,
}) {
  const [form, setForm] = useState({
    type: item.type || "",
    make: item.make || "",
    model: item.model || "",
    plate_text: item.plate_text || "",
    colors: (item.colors || [])[0] || "",
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const confirmTarget = toCamDisplayId(item.display_id || item.id)
  const [confirm, setConfirm] = useState("")

  useEffect(() => {
    if (!open) {
      setConfirm("")
    }
  }, [open])

  const doSave = async () => {
    if (!workspaceId || !videoId) {
      toast("Cannot save detection", {
        description: "Missing workspace or video context for save.",
      })
      return
    }

    setSaving(true)
    try {
      const payload = {
        typeLabel: form.type || undefined,
        makeLabel: form.make || undefined,
        modelLabel: form.model || undefined,
        plateText: form.plate_text || undefined,
        colors: form.colors
          ? [
              {
                base: String(form.colors).toUpperCase().trim(),
                finish: null,
                lightness: null,
                conf: 0.0,
              },
            ]
          : undefined,
      }

      const r = await fetch(
        `/api/workspaces/${workspaceId}/videos/${videoId}/detections/${item.id}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      const text = await r.text()
      if (!r.ok) {
        let detail = "Save failed."
        try {
          const data = text ? JSON.parse(text) : null
          detail =
            data?.error?.message ||
            data?.message ||
            data?.detail ||
            detail
        } catch {
          // ignore parse errors
        }
        throw new Error(detail)
      }

      const next = text ? JSON.parse(text) : null
      if (next) {
        onSaved(next)
      }

      toast("Detection updated", {
        description: confirmTarget || String(item.id || ""),
      })

      onOpenChange(false)
    } catch (err) {
      console.error("EditDangerDialog save failed:", err)
      const message =
        err && typeof err.message === "string" && err.message.length > 0
          ? err.message
          : "Save failed."
      toast("Save failed", {
        description: message,
      })
    } finally {
      setSaving(false)
    }
  }

  const doDelete = async () => {
    if (!workspaceId || !videoId) {
      toast("Cannot delete detection", {
        description: "Missing workspace or video context for delete.",
      })
      return
    }

    setDeleting(true)
    try {
      const r = await fetch(
        `/api/workspaces/${workspaceId}/videos/${videoId}/detections/${item.id}`,
        {
          method: "DELETE",
        }
      )

      const text = await r.text()
      if (!r.ok) {
        let detail = "Delete failed."
        try {
          const data = text ? JSON.parse(text) : null
          detail =
            data?.error?.message ||
            data?.message ||
            data?.detail ||
            detail
        } catch {
          // ignore parse errors
        }
        throw new Error(detail)
      }

      if (typeof onDeleted === "function") {
        onDeleted()
      }

      toast("Detection deleted", {
        description: confirmTarget || String(item.id || ""),
      })

      onOpenChange(false)
    } catch (err) {
      console.error("EditDangerDialog delete failed:", err)
      const message =
        err && typeof err.message === "string" && err.message.length > 0
          ? err.message
          : "Delete failed."
      toast("Delete failed", {
        description: message,
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] z-[70]">
        <DialogHeader>
          <DialogTitle>Edit Detection</DialogTitle>
          <DialogDescription>
            Update basic attributes for this detection. Deleting a detection
            will remove this row from the indexing table and may be
            irreversible.
          </DialogDescription>
        </DialogHeader>

        {/* EDIT SECTION */}
        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label className="text-neutral-500 text-xs ml-1">Type</Label>
            <Input
              value={form.type}
              onChange={(e) =>
                setForm((s) => ({ ...s, type: e.target.value }))
              }
            />
          </div>

          <div className="grid gap-1 md:grid-cols-2 md:gap-3">
            <div className="grid gap-1">
              <Label className="text-neutral-500 text-xs ml-1">Make</Label>
              <Input
                value={form.make}
                onChange={(e) =>
                  setForm((s) => ({ ...s, make: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-neutral-500 text-xs ml-1">Model</Label>
              <Input
                value={form.model}
                onChange={(e) =>
                  setForm((s) => ({ ...s, model: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-1 md:grid-cols-2 md:gap-3">
            <div className="grid gap-1">
              <Label className="text-neutral-500 text-xs ml-1">
                Plate Text
              </Label>
              <Input
                value={form.plate_text}
                onChange={(e) =>
                  setForm((s) => ({ ...s, plate_text: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-neutral-500 text-xs ml-1">Color</Label>
              <Input
                value={form.colors}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    colors: e.target.value.toUpperCase(),
                  }))
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter className="justify-between gap-2 sm:justify-end">
          <DialogClose asChild>
            <Button variant="outline" disabled={saving || deleting}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={doSave} disabled={saving || deleting}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>

        {/* DANGER ZONE */}
        <div className="mt-6 border-t border-neutral-800 pt-4">
          <p className="text-sm font-medium text-red-400 mb-2">Danger Zone</p>
          <p className="text-xs text-neutral-400 mb-3">
            To permanently delete this detection, type{" "}
            <span className="font-semibold text-neutral-200">
              {confirmTarget || "(unknown ID)"}
            </span>{" "}
            in the box below and press Delete. This will remove the detection
            from the indexing table and cannot be undone from this screen.
          </p>
          <div className="flex items-center gap-2">
            <Input
              placeholder={`${confirmTarget}`}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={deleting}
            />
            <Button
              variant="destructive"
              disabled={
                deleting ||
                !confirm ||
                (confirmTarget && confirm !== confirmTarget)
              }
              onClick={doDelete}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* =========================================================================
   Timeline normalization
   ========================================================================= */

function normalizeDetectionToTimelineItem(row, videoMeta) {
  const snapshotURL = row.snapshot_url || row.image || row.snapshot || null
  const plateURL = row.plate_url || row.plate_image || null

  const colors = Array.isArray(row.colors)
    ? row.colors.map((c) => String(c).toUpperCase())
    : row.color
    ? [String(row.color).toUpperCase()]
    : []

  const vm = videoMeta || {}

  return {
    id: row.id,
    display_id: row.display_id || row.id,
    workspace_id: row.workspace_id,
    video_id: row.video_id,

    snapshot_url: snapshotURL,
    plate_url: plateURL,

    plate_text: row.plate_text || "",
    type: row.type || row.yolo_type || "",
    make: row.make || "",
    model: row.model || "",
    colors,

    recorded_at: row.recorded_at || null,
    detected_at: row.detected_at || null,
    detected_in_ms: Number.isFinite(row.detected_in_ms)
      ? row.detected_in_ms
      : null,

    video_title: vm.title || vm.file_name || "",
    camera_code: vm.camera_code || "",
    camera_label: vm.camera_label || "",
  }
}

/* =========================================================================
   IndexingRecords (page module) — client-side filtering + pagination
   ========================================================================= */

export default function IndexingRecords() {
  const currentWorkspace = useAppStore((s) => s.currentWorkspace)

  // playback selection
  const playbackMode = useAppStore((s) => s.playbackMode)
  const playbackSelectedVideoId = useAppStore((s) => s.playbackSelectedVideoId)

  // seek
  const requestPlayerSeek = useAppStore((s) => s.requestPlayerSeek)
  const setPlaybackVideo = useAppStore((s) => s.setPlaybackVideo)

  const params = useParams()
  const wid = currentWorkspace?.id || params?.workspaceId || "default"

  // stable selector (no new object creation in selector)
  const videosById =
    useAppStore((s) => (wid ? s.videoCatalog?.[wid] : undefined) ?? EMPTY_CATALOG)

  const [selected, setSelected] = useState({
    type: [],
    color: [],
    make: [],
    model: [],
    plate: "",
  })

  // full dataset loaded once per wid / playback scope
  const [allRecords, setAllRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastError, setLastError] = useState(null)

  // pagination
  const [page, setPage] = useState(1)
  const itemsPerPage = 20

  // dialogs
  const [detailsId, setDetailsId] = useState(null)
  const [manageId, setManageId] = useState(null)

  const isMounted = useIsMounted()
  const addToTimeline = useAppStore((s) => s.addToTimeline)

  // Loader: respects workspace and playback scope; reusable for initial, refresh, polling
  const loadAll = useCallback(
    async (opts = {}) => {
      const { soft = false } = opts

      if (!wid || wid === "default") {
        setAllRecords([])
        if (!soft) {
          setLoading(false)
        }
        setLastError(null)
        return
      }

      if (!soft) {
        setLoading(true)
      }
      setLastError(null)

      try {
        const bucket = []

        // Video-scoped: detections for the selected video only
        if (playbackMode === "video" && playbackSelectedVideoId) {
          const res = await fetch(
            `/api/workspaces/${wid}/videos/${playbackSelectedVideoId}/detections?variant=cmt`,
            { cache: "no-store" }
          )
          if (res.ok) {
            const d = await res.json()
            const items = Array.isArray(d.items) ? d.items : []
            const videoMeta =
              videosById[playbackSelectedVideoId] || null
            const vidFromPayload = d.videoId || playbackSelectedVideoId

            for (const det of items) {
              bucket.push(
                normalizeVideoDetectionRow(det, {
                  videoId: vidFromPayload,
                  videoMeta,
                  workspaceId: wid,
                })
              )
            }
          } else if (res.status !== 404) {
            throw new Error("Failed to load detections for selected video.")
          }
        } else {
          // Workspace-scoped: detections for all videos via workspace endpoint
          const res = await fetch(
            `/api/workspaces/${wid}/detections?variant=cmt`,
            { cache: "no-store" }
          )
          if (!res.ok) {
            throw new Error("Failed to load workspace-wide detections.")
          }

          const d = await res.json()
          const items = Array.isArray(d.items) ? d.items : []
          const videosMap = videosById || {}

          for (const det of items) {
            const vId = det.videoId || det.video_id || null
            const videoMeta = vId && videosMap[vId] ? videosMap[vId] : null
            bucket.push(
              normalizeVideoDetectionRow(det, {
                videoId: vId,
                videoMeta,
                workspaceId: wid,
              })
            )
          }
        }

        setAllRecords(bucket)
        setPage(1)
      } catch (err) {
        console.error("IndexingRecords loadAll error:", err)
        setAllRecords([])
        setLastError(err?.message || "Failed to load detections.")
      } finally {
        if (!soft) {
          setLoading(false)
        }
      }
    },
    [wid, playbackMode, playbackSelectedVideoId, videosById]
  )

  // Initial + scope-change load
  useEffect(() => {
    loadAll({ soft: false })
  }, [loadAll])

  // reset page on filter change (auto-apply filters)
  useEffect(() => {
    setPage(1)
  }, [selected.type, selected.color, selected.make, selected.model, selected.plate])

  // filtered dataset (client-side)
  const filtered = useMemo(() => {
    return allRecords.filter((r) => {
      if (!matchesNullableExact(selected.type, r.type)) return false
      if (!matchesNullableExact(selected.make, r.make)) return false
      if (!matchesNullableModel(selected.model, r.model)) return false
      if (!matchesNullableColors(selected.color, r.colors)) return false

      const plate = r.plate_text || ""
      if (selected.plate && !toLower(plate).includes(toLower(selected.plate))) {
        return false
      }

      return true
    })
  }, [allRecords, selected])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage))

  const pageItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, page])

  const toggleSelection = (key, value) => {
    setSelected((prev) => {
      const already = prev[key].includes(value)
      return {
        ...prev,
        [key]: already
          ? prev[key].filter((v) => v !== value)
          : [...prev[key], value],
      }
    })
  }

  const renderSelect = (label, key) => (
    <Popover key={key}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full h-12 p-2 px-4 rounded-md border border-neutral-700 bg-neutral-900 flex items-center justify-between text-sm text-white hover:bg-neutral-800"
        >
          {selected[key].length > 0 ? (
            <span>
              {selected[key].slice(0, 2).join(", ")}
              {selected[key].length > 2 && ` +${selected[key].length - 2}`}
            </span>
          ) : (
            <span>Select {label}</span>
          )}
          <ChevronDown size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0 bg-neutral-900 border border-neutral-700">
        <Command>
          <CommandInput
            placeholder={`Search ${label}`}
            className="text-white"
          />
          <CommandList>
            {(options[key] || []).map((opt) => (
              <CommandItem
                key={opt}
                onSelect={() => toggleSelection(key, opt)}
                className="text-sm cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-1 h-4 w-4 text-orange-500",
                    selected[key].includes(opt) ? "opacity-100" : "opacity-0"
                  )}
                />
                {opt}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )

  const clearFilters = () => {
    setSelected({ type: [], color: [], make: [], model: [], plate: "" })
    setPage(1)
  }

  return (
    <div className="w-full h-full flex flex-col p-8 items-start justify-start">
      {/* Header */}
      <div className="flex flex-row items-center mb-4 w-full justify-between">
        <div className="flex flex-row gap-4 items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/indexing.svg" alt="Indexing" className="w-6 h-6" />
          <div className="h-6 w-[1px] border-[1px] border-neutral-800" />
          <p className="text-md">Indexing Records</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-xs px-3 py-2 border border-neutral-700 rounded-md hover:bg-neutral-800 flex items-center gap-1"
            onClick={() => loadAll({ soft: false })}
            disabled={loading}
          >
            {loading && <Loader2 className="h-3 w-3 animate-spin" />}
            Refresh
          </button>
          <button className="text-sm px-4 py-2 gap-2 bg-orange-500 text-white rounded-md hover:bg-orange-400 flex flex-row items-center justify-center">
            <Download size={14} />
            Download CSV
          </button>
        </div>
      </div>

      <div className="h-[1px] w-full border-[1px] border-neutral-800 mt-2 mb-4" />

      {/* Scope indicator */}
      <div className="w-full mb-4 flex items-center justify-between text-xs text-neutral-400">
        <span>
          Scope:&nbsp;
          {playbackMode === "video" && playbackSelectedVideoId
            ? "Video scope — detections for selected playback video"
            : "All videos in this workspace"}
        </span>
      </div>

      <div className="h-[1px] w-full border-[1px] border-neutral-900 mb-4" />

      {/* Filters row (live filtering + Clear button) */}
      <div className="grid grid-cols-[repeat(5,minmax(0,1fr))_auto] gap-4 w-full mb-6">
        {renderSelect("Vehicle Type", "type")}
        {renderSelect("Color", "color")}
        {renderSelect("Make", "make")}
        {renderSelect("Model", "model")}
        <Input
          type="text"
          placeholder="Plate Number"
          className="w-full h-12 text-sm text-white bg-neutral-900 border border-neutral-700 placeholder:text-neutral-400"
          value={selected.plate}
          onChange={(e) =>
            setSelected((prev) => ({ ...prev, plate: e.target.value }))
          }
        />
        <Button
          variant="outline"
          className="h-12 px-6 py-2 text-sm rounded-md border-neutral-700"
          onClick={clearFilters}
          title="Clear all filters"
          type="button"
        >
          Clear
        </Button>
      </div>

      {/* Table */}
      <div className="w-full mt-8 border border-neutral-800 rounded-lg overflow-hidden">
        <Table className="border-spacing-x-4 border-spacing-y-0 [&_th]:px-2 [&_td]:px-2">
          <TableHeader className="bg-neutral-900 border-b border-neutral-800">
            <TableRow>
              <TableHead className="text-white">ID</TableHead>
              <TableHead className="text-white">Vehicle Snapshot</TableHead>
              <TableHead className="text-white">Type</TableHead>
              <TableHead className="text-white">Color</TableHead>
              <TableHead className="text-white">Make</TableHead>
              <TableHead className="text-white">Model</TableHead>
              <TableHead className="text-white">Plate Number</TableHead>
              <TableHead className="text-neutral-700 text-center w-8">
                |
              </TableHead>
              <TableHead className="text-white">Timestamp</TableHead>
              <TableHead className="text-center text-white ml-2">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && allRecords.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-xs text-neutral-400 py-8 text-center"
                >
                  <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                  Loading records…
                </TableCell>
              </TableRow>
            )}

            {!loading && total === 0 && (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-xs text-neutral-400 py-8 text-center"
                >
                  {!wid || wid === "default"
                    ? "Select a workspace to view detections."
                    : lastError || "No matching records."}
                </TableCell>
              </TableRow>
            )}

            {pageItems.map((item) => {
              const shortId = toCamDisplayId(item.display_id || item.id)
              const modelDisplay = item.model ? trimModelName(item.model) : null

              return (
                <TableRow
                  key={item.id}
                  className="hover:bg-neutral-800 relative"
                >
                  <TableCell className="text-xs">{shortId}</TableCell>

                  {/* Snapshot → Details */}
                  <TableCell>
                    <Dialog
                      open={detailsId === item.id}
                      onOpenChange={(o) => setDetailsId(o ? item.id : null)}
                    >
                      <DialogTrigger asChild>
                        <div
                          className="h-16 w-24 border border-neutral-800 rounded-sm overflow-hidden cursor-pointer bg-neutral-900 flex items-center justify-center text-[10px] text-neutral-500"
                          title="View detection details"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {item.snapshot_url ? (
                            <img
                              className="h-full w-full object-cover"
                              src={item.snapshot_url}
                              alt=""
                            />
                          ) : (
                            <>View</>
                          )}
                        </div>
                      </DialogTrigger>
                      <VideoAnalysisDetailsDialog
                        id={item.id}
                        videoId={item.video_id}
                        workspaceId={wid}
                        open={detailsId === item.id}
                      />
                    </Dialog>
                  </TableCell>

                  <TableCell className="text-xs">
                    {renderLabelWithConf(item.type, item.type_conf)}
                  </TableCell>

                  <TableCell className="text-xs">
                    {String((item.colors && item.colors[0]) || "-").toUpperCase()}
                  </TableCell>

                  <TableCell className="text-xs">
                    {renderLabelWithConf(item.make, item.make_conf)}
                  </TableCell>

                  <TableCell className="text-xs">
                    {renderLabelWithConf(modelDisplay, item.model_conf)}
                  </TableCell>

                  <TableCell>
                    <div className="h-16 w-24 flex flex-col items-center justify-center">
                      <p className="text-xs">{item.plate_text || "-"}</p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="h-16 w-8 flex flex-col items-center justify-center">
                      <div className="w-[1px] h-[75%] bg-neutral-700" />
                    </div>
                  </TableCell>

                  {/* Timestamp → seek (compute offset locally) */}
                  <TableCell className="text-xs">
                    {item.detected_at ? (
                      <span
                        className="cursor-pointer hover:text-orange-500"
                        title="Seek player to this detection"
                        onClick={() => {
                          if (!item.video_id) return
                          const meta = videosById[item.video_id]
                          const ms = computeSeekMs(item, meta)
                          setPlaybackVideo(item.video_id)
                          requestPlayerSeek({
                            videoId: item.video_id,
                            ms,
                            autoplay: true,
                          })
                        }}
                      >
                        <span suppressHydrationWarning>
                          {isMounted ? fmtHMS(item.detected_at) : ""}
                        </span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>

                  {/* Actions: Add to timeline + Edit */}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {/* Add to timeline */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md hover:bg-neutral-700"
                        title="Add to Tracking Timeline"
                        onClick={(e) => {
                          e.stopPropagation()

                          const vm = videosById[item.video_id] || null
                          const tlItem = normalizeDetectionToTimelineItem(
                            item,
                            vm
                          )

                          const camId = toCamDisplayId(
                            item.display_id || item.id
                          )

                          const state = useAppStore.getState()
                          const list = state.timeline?.[wid] || []
                          const exists = list.some((x) => x.id === tlItem.id)

                          if (exists) {
                            toast("Already in timeline", {
                              description: camId,
                            })
                            return
                          }

                          addToTimeline(wid, tlItem)

                          toast("Added to Timeline", {
                            description: camId,
                            action: {
                              label: "Undo",
                              onClick: () => {
                                useAppStore
                                  .getState()
                                  .removeFromTimeline(wid, tlItem.id)
                              },
                            },
                          })
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>

                      {/* Edit / Manage */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md hover:bg-neutral-700"
                        title="Edit / Manage"
                        onClick={(e) => {
                          e.stopPropagation()
                          setManageId(item.id)
                        }}
                      >
                        <EllipsisVertical className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Edit dialog for this row */}
                    <EditDangerDialog
                      item={item}
                      workspaceId={wid}
                      videoId={item.video_id}
                      open={manageId === item.id}
                      onOpenChange={(o) => setManageId(o ? item.id : null)}
                      onSaved={(next) => {
                        setAllRecords((prev) =>
                          prev.map((r) =>
                            r.id === item.id
                              ? normalizeVideoDetectionRow(next, {
                                  videoId: r.video_id,
                                  videoMeta: videosById[r.video_id] || null,
                                  workspaceId: wid,
                                })
                              : r
                          )
                        )
                      }}
                      onDeleted={() => {
                        setAllRecords((prev) =>
                          prev.filter((r) => r.id !== item.id)
                        )
                      }}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex justify-end p-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  className="text-white"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                />
              </PaginationItem>
              <PaginationItem>
                <div className="text-sm text-neutral-400 px-2 pt-1">
                  Page {page} of {totalPages}
                </div>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  className="text-white"
                  onClick={() =>
                    setPage((prev) =>
                      prev < totalPages ? prev + 1 : prev
                    )
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  )
}
