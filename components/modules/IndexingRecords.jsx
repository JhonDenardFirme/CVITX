"use client"

import { useState, useEffect, useMemo, Fragment } from "react"
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

import { Check, ChevronDown, Download, EllipsisVertical, Loader2, Plus, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"


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

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"


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
  useEffect(() => { setMounted(true) }, [])
  return mounted
}

/** CTX1004-CAM1-0002 -> CAM1-0002 */
function toCamDisplayId(value) {
  const s = String(value ?? "")
  const m = s.match(/(CAM[A-Za-z0-9-]+)/)
  return m ? m[1] : s
}

/** tiny confidence chip */
function Conf({ v }) {
  return (
    <span className="text-xs text-neutral-400">
      {typeof v === "number" ? `${Math.round(v * 100)}%` : "—"}
    </span>
  )
}

/** hh:mm:ss for rows (localized, client-only to avoid hydration mismatch) */
function fmtHMS(dateStr) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return d.toLocaleTimeString(
    [],
    { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }
  )
}

/** compute seek offset (ms from video start) using local catalog */
function computeSeekMs(det, videoMeta) {
  // 1) trust API if it's a sane, non-negative number
  if (Number.isFinite(det?.detected_in_ms) && det.detected_in_ms >= 0) {
    return det.detected_in_ms
  }
  // 2) derive from timestamps (timezone-safe epoch math)
  const detAt = Date.parse(det?.detected_at || "")
  const recAt = Date.parse(videoMeta?.recorded_at || "")
  let ms = Number.isFinite(detAt) && Number.isFinite(recAt) ? Math.max(0, detAt - recAt) : 0
  // 3) clamp to video duration if known
  const durMs = Number.isFinite(videoMeta?.durationSec) ? videoMeta.durationSec * 1000 : null
  if (Number.isFinite(durMs)) {
    ms = Math.min(ms, Math.max(0, durMs))
  }
  return ms
}

/* =========================================================================
   Evidence / Details dialog (modular, professional layout)
   ========================================================================= */
function DetailsField({ label, children, mono }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] uppercase tracking-wider text-neutral-400">{label}</div>
      <div className={cn("text-sm", mono && "font-mono")}>{children || "—"}</div>
    </div>
  )
}

function DetailsCard({ title, children }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
      <div className="text-xs text-neutral-300 mb-2">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

/* =========================================================================
   ADDING TO TIMELINE
   ========================================================================= */

function normalizeDetectionToTimelineItem(row, videoMeta) {
  // Resolve URLs — your API seems to already provide `snapshot_url` / `plate_url`.
  // If you only have S3 keys in some environments, resolve upstream or add a small helper.
  const snapshotURL =
    row.snapshot_url || row.image || row.snapshot || null
  const plateURL =
    row.plate_url || row.plate_image || null

  // normalize colors → uppercase array
  const colors = Array.isArray(row.colors)
    ? row.colors.map((c) => String(c).toUpperCase())
    : (row.color ? [String(row.color).toUpperCase()] : [])

  const vm = videoMeta || {}

  return {
    // core ids
    id: row.id,
    display_id: row.display_id || row.id,
    workspace_id: row.workspace_id,
    video_id: row.video_id,

    // media
    snapshot_url: snapshotURL,
    plate_url: plateURL,

    // vehicle props
    plate_text: row.plate_text || "",
    type: row.type || row.yolo_type || "",
    make: row.make || "",
    model: row.model || "",
    colors,

    // timing
    recorded_at: row.recorded_at || null,
    detected_at: row.detected_at || null,
    detected_in_ms: Number.isFinite(row.detected_in_ms) ? row.detected_in_ms : null,

    // video label + camera info
    video_title: vm.title || vm.file_name || "",
    camera_code: vm.camera_code || "",
    camera_label: vm.camera_label || "",

    // (optional) anything else you want to keep for later
    // parts: row.parts || [],
    // evidence: row.evidence || null,
  }
}


/** Used INSIDE a <Dialog> (no nested Dialogs) */
function DetectionDetailsDialog({ id, open }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const [vizUrl, setVizUrl] = useState(null)
  const [vizLoading, setVizLoading] = useState(false)

  const isMounted = useIsMounted()

  useEffect(() => {
    if (!open || !id) return
    setLoading(true)
    fetch(`/api/proxy/detections/${id}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j) => setData(j))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [open, id])

  const requestVisualization = async () => {
    setVizLoading(true)
    try {
      const r = await fetch(`/api/proxy/detections/${id}/evidence`, { method: "POST" })
      const j = await r.json().catch(() => ({}))
      setVizUrl(j?.image_url || (data?.snapshot_url || null))
    } catch {
      setVizUrl(data?.snapshot_url || null)
    } finally {
      setVizLoading(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-[920px] max-h-[85vh] overflow-y-auto z-[70]">
      <DialogHeader className="pb-2">
        <DialogTitle className="text-lg">Detection Details</DialogTitle>
        <DialogDescription>Review the AI attributes and generated evidence.</DialogDescription>
      </DialogHeader>

      {!data ? (
        <div className="py-16 flex items-center justify-center text-sm text-neutral-400">
          {loading ? (
            <Fragment>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
            </Fragment>
          ) : (
            "No data"
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
          {/* LEFT: Snapshot + Evidence */}
          <div className="space-y-4">
            <DetailsCard title="Snapshot">
              <div className="w-full rounded-lg overflow-hidden border border-neutral-800 bg-black">
                <img src={data.snapshot_url} className="w-full h-auto object-contain" alt="" />
              </div>
            </DetailsCard>

            <DetailsCard title="AI Detection Visualization">
              {!vizUrl ? (
                <Button
                  variant="outline"
                  onClick={requestVisualization}
                  disabled={vizLoading}
                  className="h-8 w-fit px-3 border-dashed border-neutral-700 hover:bg-neutral-900"
                >
                  {vizLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {vizLoading ? "Processing…" : "Request AI Detection Report"}
                </Button>
              ) : null}

              <div
                className={cn(
                  "w-full border border-dashed border-neutral-700 rounded-lg bg-neutral-950 flex items-center justify-center overflow-hidden transition-all",
                  vizUrl ? "h-auto p-2" : "h-28"
                )}
              >
                {vizUrl ? (
                  <div className="max-w-full">
                    <img
                      src={vizUrl}
                      alt="Evidence"
                      className="mx-auto"
                      style={{ width: "min(720px, 100%)", height: "auto", aspectRatio: "1 / 1" }}
                    />
                  </div>
                ) : (
                  <span className="text-xs text-neutral-500">Will expand to show a visualization when ready.</span>
                )}
              </div>
            </DetailsCard>
          </div>

          {/* RIGHT: Structured attributes */}
          <div className="space-y-4">
            <DetailsCard title="Primary">
              <DetailsField label="Type">
                {data.type || "—"} <Conf v={data.type_conf} />
              </DetailsField>

              <DetailsField label="Make / Model">
                {(data.make || "—")}{data.model ? ` ${data.model}` : ""} <Conf v={Math.min(data.make_conf ?? 1, data.model_conf ?? 1)} />
              </DetailsField>

              <DetailsField label="Colors">
                <div className="flex flex-wrap gap-1">
                  {(data.colors || []).map((c) => (
                    <Badge key={c} variant="secondary" className="text-[11px]">{c}</Badge>
                  ))}
                </div>
              </DetailsField>
            </DetailsCard>

            <DetailsCard title="Timing">
              <DetailsField label="Recorded At">
                <span suppressHydrationWarning>
                  {isMounted && data.recorded_at ? new Date(data.recorded_at).toLocaleString() : ""}
                </span>
              </DetailsField>
              <DetailsField label="Detected At">
                <span suppressHydrationWarning>
                  {isMounted && data.detected_at ? new Date(data.detected_at).toLocaleString() : ""}
                </span>
              </DetailsField>
              <DetailsField label="Detected In (ms)" mono>
                {Number.isFinite(data.detected_in_ms) ? data.detected_in_ms : "—"}
              </DetailsField>
            </DetailsCard>

            <DetailsCard title="License Plate">
              <DetailsField label="Text" mono>{data.plate_text || "—"}</DetailsField>
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wider text-neutral-400">Plate Image</div>
                <div className="h-16 w-28 border border-neutral-800 rounded-md bg-neutral-900 flex items-center justify-center overflow-hidden">
                  {data.plate_url ? (
                    <img src={data.plate_url} className="h-full w-full object-cover" alt="Plate" />
                  ) : (
                    <span className="text-[10px] text-neutral-500">NO IMAGE</span>
                  )}
                </div>
              </div>
            </DetailsCard>

            <DetailsCard title="Parts">
              {Array.isArray(data.parts) && data.parts.length ? (
                <ul className="text-sm grid grid-cols-1 gap-1">
                  {data.parts.map((p, i) => (
                    <li key={i} className="flex items-center justify-between border-b border-neutral-800 py-1">
                      <span>{p?.name || p?.label || "Part"}</span>
                      <Conf v={p?.conf} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-neutral-500">No parts recorded.</div>
              )}
            </DetailsCard>
          </div>
        </div>
      )}

      <DialogFooter className="mt-4">
        <DialogClose asChild>
          <Button variant="outline">Close</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  )
}

/* =========================================================================
   Combined Edit + Danger Zone (single dialog styled like Workspace)
   ========================================================================= */
function EditDangerDialog({ item, open, onOpenChange, onSaved, onDeleted }) {
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
    if (!open) setConfirm("")
  }, [open])

  const doSave = async () => {
    setSaving(true)
    try {
      const payload = {
        type: form.type || null,
        make: form.make || null,
        model: form.model || null,
        plate_text: form.plate_text || null,
        colors: form.colors ? [form.colors] : [],
      }
      const r = await fetch(`/api/proxy/detections/${item.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
      const j = await r.json()
      if (!r.ok) throw new Error("save failed")
      onSaved(j)
      onOpenChange(false)
    } catch {
      alert("Save failed.")
    } finally {
      setSaving(false)
    }
  }

  const doDelete = async () => {
    if (confirm.trim() !== confirmTarget) return
    setDeleting(true)
    try {
      const r = await fetch(`/api/proxy/detections/${item.id}`, { method: "DELETE" })
      if (!r.ok) throw new Error()
      onDeleted()
      onOpenChange(false)
    } catch {
      alert("Delete failed.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] z-[70]">
        <DialogHeader>
          <DialogTitle>Edit Detection</DialogTitle>
          <DialogDescription>Update basic attributes or delete the detection permanently.</DialogDescription>
        </DialogHeader>

        {/* EDIT SECTION */}
        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label className="text-neutral-500 text-xs ml-1">Type</Label>
            <Input value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))} />
          </div>
          <div className="grid gap-1 md:grid-cols-2 md:gap-3">
            <div className="grid gap-1">
              <Label className="text-neutral-500 text-xs ml-1">Make</Label>
              <Input value={form.make} onChange={(e) => setForm((s) => ({ ...s, make: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label className="text-neutral-500 text-xs ml-1">Model</Label>
              <Input value={form.model} onChange={(e) => setForm((s) => ({ ...s, model: e.target.value }))} />
            </div>
          </div>
          <div className="grid gap-1 md:grid-cols-2 md:gap-3">
            <div className="grid gap-1">
              <Label className="text-neutral-500 text-xs ml-1">Plate Text</Label>
              <Input value={form.plate_text} onChange={(e) => setForm((s) => ({ ...s, plate_text: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label className="text-neutral-500 text-xs ml-1">Color</Label>
              <Input value={form.colors} onChange={(e) => setForm((s) => ({ ...s, colors: e.target.value.toUpperCase() }))} />
            </div>
          </div>
        </div>

        <DialogFooter className="justify-between gap-2 sm:justify-end">
          <DialogClose asChild>
            <Button variant="outline" disabled={saving || deleting}>Cancel</Button>
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
            <span className="font-semibold text-neutral-200">{confirmTarget || "(unknown ID)"}</span> below.
          </p>
          <div className="flex items-center gap-2">
            <Input
              placeholder={`${confirmTarget}`}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <Button
              variant="destructive"
              disabled={confirm.trim() !== confirmTarget || deleting}
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

  // ✅ stable selector (NO new object creation in selector)
  const videosById = useAppStore((s) => (wid ? s.videoCatalog?.[wid] : undefined) ?? EMPTY_CATALOG)

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

  // pagination
  const [page, setPage] = useState(1)
  const itemsPerPage = 20

  // dialogs
  const [detailsId, setDetailsId] = useState(null)
  const [manageId, setManageId] = useState(null)

  const isMounted = useIsMounted()

  const addToTimeline = useAppStore((s) => s.addToTimeline)


  // Load ALL records once when workspace or playback scope changes.
  useEffect(() => {
    let ignore = false
    async function loadAll() {
      if (!wid || wid === "default") {
        if (!ignore) setAllRecords([])
        return
      }
      setLoading(true)
      try {
        const limit = 200
        let offset = 0
        let total = Infinity
        const bucket = []

        while (offset < total) {
          const qs = new URLSearchParams({
            workspace_id: wid,
            order: "detected_at_desc",
            limit: String(limit),
            offset: String(offset),
          })
          if (playbackMode === "video" && playbackSelectedVideoId) {
            qs.set("video_id", playbackSelectedVideoId)
          }
          const res = await fetch(`/api/proxy/detections?${qs.toString()}`, { cache: "no-store" })
          if (!res.ok) break
          const d = await res.json()
          const items = Array.isArray(d.items) ? d.items : []
          const t = d.pagination?.total ?? d.total ?? items.length
          total = Number.isFinite(t) ? t : items.length
          bucket.push(...items)
          offset += limit
          if (items.length < limit) break
        }

        if (!ignore) {
          setAllRecords(bucket)
          setPage(1) // reset page on dataset scope change
        }
      } catch {
        if (!ignore) setAllRecords([])
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    loadAll()
    return () => { ignore = true }
  }, [wid, playbackMode, playbackSelectedVideoId])

  // Normalize to lowercase for CI compare
  const toLower = (v) => String(v || "").toLowerCase()
  const anyIn = (needleArr, haystackVal) => {
    if (!needleArr?.length) return true
    const hv = toLower(haystackVal)
    return needleArr.some((n) => toLower(n) === hv)
  }
  const anyOverlapColors = (needleArr, haystackArr) => {
    if (!needleArr?.length) return true
    const set = new Set((haystackArr || []).map((c) => toLower(c)))
    return needleArr.some((n) => set.has(toLower(n)))
  }

  // Filter locally (as-you-type). Reset to page 1 on any filter change.
  useEffect(() => {
    setPage(1)
  }, [selected.type, selected.color, selected.make, selected.model, selected.plate])

  const filtered = useMemo(() => {
    const plateNeedle = toLower(selected.plate).trim()
    return allRecords.filter((r) => {
      if (plateNeedle) {
        const plate = toLower(r.plate_text)
        if (!plate.includes(plateNeedle)) return false
      }
      if (!anyIn(selected.type, r.type)) return false
      if (!anyIn(selected.make, r.make)) return false
      if (!anyIn(selected.model, r.model)) return false
      if (!anyOverlapColors(selected.color, r.colors)) return false
      return true
    })
  }, [allRecords, selected.type, selected.make, selected.model, selected.color, selected.plate])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage))
  const pageItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, page])

  const toggleSelection = (key, value) => {
    setSelected((prev) => {
      const already = prev[key].includes(value)
      return { ...prev, [key]: already ? prev[key].filter((v) => v !== value) : [...prev[key], value] }
    })
  }

  const renderSelect = (label, key) => (
    <Popover key={key}>
      <PopoverTrigger asChild>
        <button className="w-full h-12 p-2 px-4 rounded-md border border-neutral-700 bg-neutral-900 flex items-center justify-between text-sm text-white hover:bg-neutral-800">
          {selected[key].length > 0 ? (
            <span>
              {selected[key].slice(0, 2).join(", ")}
              {selected[key].length > 2 && ` +${selected[key].length - 2}`}
            </span>
          ) : <span>Select {label}</span>}
          <ChevronDown size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0 bg-neutral-900 border border-neutral-700">
        <Command>
          <CommandInput placeholder={`Search ${label}`} className="text-white" />
          <CommandList>
            {Array.isArray(options[key]) && options[key].map((opt) => (
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

  return (
    <div className="w-full h-full flex flex-col p-8 items-start justify-start">
      {/* Header */}
      <div className="flex flex-row items-center mb-4 w-full justify-between">
        <div className="flex flex-row gap-4 items-center">
          <img src="/icons/indexing.svg" alt="Indexing" className="w-6 h-6" />
          <div className="h-6 w-[1px] border-[1px] border-neutral-800" />
          <p className="text-md">Indexing Records</p>
        </div>

        <button className="text-sm px-4 py-2 gap-2 bg-orange-500 text-white rounded-md hover:bg-orange-400 flex flex-row items-center justify-center">
          <Download size={14} />
          Download CSV
        </button>
      </div>

      <div className="h-[1px] w-full border-[1px] border-neutral-800 mt-2 mb-8" />

      {/* Filters row (live filtering) */}
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
          onChange={(e) => setSelected((prev) => ({ ...prev, plate: e.target.value }))}
        />
        <Button
          className="bg-orange-500 h-12 hover:bg-orange-400 text-white px-6 py-2 text-sm rounded-md"
          onClick={() => setPage(1)}
        >
          Submit
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
              <TableHead className="text-neutral-700 text-center w-8">|</TableHead>
              <TableHead className="text-white">Timestamp</TableHead>
              <TableHead className="text-center text-white ml-2">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && allRecords.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-xs text-neutral-400 py-8 text-center">
                  Loading records…
                </TableCell>
              </TableRow>
            )}

            {!loading && total === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-xs text-neutral-400 py-8 text-center">
                  No matching records.
                </TableCell>
              </TableRow>
            )}

            {pageItems.map((item) => {
              const shortId = toCamDisplayId(item.display_id || item.id)
              return (
                <TableRow key={item.id} className="hover:bg-neutral-800 relative">
                  <TableCell className="text-xs">{shortId}</TableCell>

                  {/* Snapshot → Details */}
                  <TableCell>
                    <Dialog open={detailsId === item.id} onOpenChange={(o) => setDetailsId(o ? item.id : null)}>
                      <DialogTrigger asChild>
                        <div
                          className="h-16 w-24 border border-neutral-800 rounded-sm overflow-hidden cursor-pointer"
                          title="View detection details"
                        >
                          <img className="h-full w-full object-cover" src={item.snapshot_url} alt="" />
                        </div>
                      </DialogTrigger>
                      <DetectionDetailsDialog id={item.id} open={detailsId === item.id} />
                    </Dialog>
                  </TableCell>

                  <TableCell className="text-xs">{item.type || "-"}</TableCell>
                  <TableCell className="text-xs">{(item.colors?.[0] || "-").toString().toUpperCase()}</TableCell>
                  <TableCell className="text-xs">{item.make || "-"}</TableCell>
                  <TableCell className="text-xs">{item.model || "-"}</TableCell>

                  <TableCell>
                    <div className="h-16 w-24 flex flex-col items-center justify-center">
                      <p className="text-xs">{item.plate_text || "-"}</p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="h-16 w-8 flex flex-col items-center justify-center ">
                      <div className="w-[1px] h-[75%] bg-neutral-700"></div>
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
                          requestPlayerSeek({ videoId: item.video_id, ms, autoplay: true })
                        }}
                      >
                        <span suppressHydrationWarning>
                          {isMounted ? fmtHMS(item.detected_at) : ""}
                        </span>
                      </span>
                    ) : "—"}
                  </TableCell>

                  {/* Actions: open dialog directly */}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {/* + Add to timeline (unchanged) */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md hover:bg-neutral-700"
                        title="Add to Tracking Timeline"
                        onClick={(e) => {
                          e.stopPropagation()

                          // build the item
                          const vm = videosById[item.video_id] || null
                          const tlItem = normalizeDetectionToTimelineItem(item, vm)

                          // compute the short CAM id (e.g., CTX1004-CAM5-0006 -> CAM5-0006)
                          const camId = toCamDisplayId(item.display_id || item.id)

                          // check if already in timeline
                          const state = useAppStore.getState()
                          const list = (state.timeline?.[wid] || [])
                          const exists = list.some((x) => x.id === tlItem.id)

                          if (exists) {
                            toast("Already in timeline", {
                              description: camId,
                            })
                            return
                          }

                          // add
                          state.addToTimeline(wid, tlItem)

                          // toast with Undo
                          toast("Added to Timeline", {
                            description: camId,
                            action: {
                              label: "Undo",
                              onClick: () => {
                                useAppStore.getState().removeFromTimeline(wid, tlItem.id)
                              },
                            },
                          })
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>


                      {/* Ellipsis menu → opens Edit dialog */}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md hover:bg-neutral-700"
                        title="Edit / Manage"
                        onClick={(e) => {
                          e.stopPropagation()
                          setManageId(item.id)   // <— this opens the dialog
                        }}
                      >
                        <EllipsisVertical className="h-4 w-4" />
                      </Button>


                    </div>

                    {/* Keep the dialog mounted per-row; it opens when manageId === item.id */}
                    <EditDangerDialog
                      item={item}
                      open={manageId === item.id}
                      onOpenChange={(o) => setManageId(o ? item.id : null)}
                      onSaved={(next) => {
                        setAllRecords((prev) => prev.map((r) => (r.id === item.id ? { ...r, ...next } : r)))
                      }}
                      onDeleted={() => {
                        setAllRecords((prev) => prev.filter((r) => r.id !== item.id))
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
                  onClick={() => setPage((prev) => (prev < totalPages ? prev + 1 : prev))}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  )
}
