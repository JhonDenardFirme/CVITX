"use client"

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { useState, useMemo, useCallback, useEffect } from "react"

// helper: update a single workspace's timeline immutably
function setTimelineForWid(wid, updater) {
  useAppStore.setState((prev) => {
    const current = prev.timeline?.[wid] || []
    const next = updater(current)
    return { timeline: { ...prev.timeline, [wid]: next } }
  })
}

// map your /data/indexing-records.json rows to normalized timeline items
function normalizeFromIndexingRow(item) {
  return {
    id: item.uid,
    display_id: String(item.uid),
    snapshot_url: item.image,
    plate_url: item.plate_image && item.plate_image !== "NULL" ? item.plate_image : null,
    plate_text: item.plate_number && item.plate_number !== "NULL" ? item.plate_number : "",
    colors: item.color ? [item.color.toUpperCase()] : [],
    make: item.make !== "UNCATEGORIZED" ? item.make : "",
    model: item.model !== "UNCATEGORIZED" ? item.model : "",
    detected_at: item.first_seen,
    footage_label: "Footage 1",
    location: "Anonas Street",
  }
}

export default function TimelineSheet() {
  const { timeline, removeFromTimeline, clearTimeline, currentWorkspace, setActivePanel } =
    useAppStore()
  const wid = currentWorkspace?.id || "default"
  const items = useMemo(() => timeline[wid] || [], [timeline, wid])
  const router = useRouter()

  // ------------- one-time DEMO seeding (per workspace) -------------
  useEffect(() => {
    const seedKey = `cvitx-demo-seeded-${wid}`
    if (items.length > 0) return
    if (typeof window === "undefined") return
    if (window.localStorage.getItem(seedKey) === "1") return

    // fetch a few demo rows from /public/data/indexing-records.json
    ;(async () => {
      try {
        const res = await fetch("/data/indexing-records.json")
        if (!res.ok) return
        const json = await res.json()
        const demo = (json || []).slice(0, 5).map(normalizeFromIndexingRow)
        if (demo.length) {
          setTimelineForWid(wid, () => demo)
          window.localStorage.setItem(seedKey, "1")
        }
      } catch {
        // swallow — keep empty if fetch fails
      }
    })()
  }, [items.length, wid])

  // ---- Drag state (only inside this sheet) ----
  const [draggingId, setDraggingId] = useState(null)

  const handleDragStart = useCallback((id) => setDraggingId(id), [])
  const handleDragOverCard = useCallback((e) => e.preventDefault(), [])
  const handleDragEnd = useCallback(() => setDraggingId(null), [])

  const handleDropOnCard = useCallback(
    (targetId) => {
      if (!draggingId || draggingId === targetId) return
      const fromIndex = items.findIndex((x) => x.id === draggingId)
      const toIndex = items.findIndex((x) => x.id === targetId)
      if (fromIndex < 0 || toIndex < 0) return

      const reordered = [...items]
      const [moved] = reordered.splice(fromIndex, 1)
      reordered.splice(toIndex, 0, moved)
      setTimelineForWid(wid, () => reordered)
      setDraggingId(null)
    },
    [draggingId, items, wid]
  )

  function gotoReport() {
    if (currentWorkspace?.id) router.push(`/w/${currentWorkspace.id}/ai-technical-writer`)
    else setActivePanel("AI Technical Writer")
  }

  // ---- (future) backend fetch ready ----
  // useEffect(() => {
  //   async function fetchFromAPI() {
  //     const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/timeline?workspace_id=${wid}`, {
  //       headers: { 'X-API-Key': process.env.NEXT_PUBLIC_API_KEY },
  //     })
  //     const data = await res.json()
  //     setTimelineForWid(wid, () => data.items || [])
  //   }
  //   // fetchFromAPI()
  // }, [wid])

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="fixed top-8 right-4 z-50 p-2 rounded-md bg-orange-500 hover:bg-neutral-700"
          title="Open Tracking Timeline"
        >
          <img src="/icons/timeline.svg" alt="Timeline" className="w-6 h-6" />
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[320px] bg-neutral-900 border-l border-neutral-700">
        <div className="w-full h-full flex flex-col items-start justify-start overflow-y-auto scrollbar-none">
          <div className="h-12 w-full rounded-md border border-neutral-700 mb-4 px-4 flex items-center justify-center gap-2">
            <img src="/icons/detection.svg" alt="Vehicle Detection" className="w-5 h-5" />
            <p className="text-xs text-white">Tracking Timeline</p>
          </div>

          <div className="flex flex-col w-full items-center justify-start gap-4 px-2 pb-4">
            {items.length === 0 && (
              <p className="text-xs text-neutral-400 mt-4">
                No items yet. Add from Indexing or Vehicle Detection.
              </p>
            )}

            {items.map((it) => (
              <div
                key={it.id}
                draggable
                onDragStart={() => handleDragStart(it.id)}
                onDragOver={handleDragOverCard}
                onDrop={() => handleDropOnCard(it.id)}
                onDragEnd={handleDragEnd}
                className={[
                  "relative h-full w-full rounded-md border border-neutral-700 p-4",
                  "flex flex-col items-center justify-start gap-2",
                  "cursor-grab active:cursor-grabbing select-none",
                  draggingId === it.id ? "opacity-80 ring-1 ring-orange-500" : "opacity-100",
                ].join(" ")}
              >
                {/* tiny absolute remove */}
                <button
                  aria-label="Remove"
                  title="Remove"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFromTimeline(wid, it.id)
                  }}
                  className="absolute top-1.5 right-1.5 h-6 w-6 flex items-center justify-center rounded-md text-neutral-400 hover:text-white hover:bg-red-500/20 transition"
                >
                  <span className="text-sm leading-none">×</span>
                </button>

                <div className="w-full flex flex-row justify-between items-center mb-1">
                  <p className="text-sm font-medium capitalize">
                    {(it.colors?.[0] || "").toUpperCase()} {it.make || ""} {it.model || ""}
                  </p>
                  <span className="text-[10px] text-neutral-400">#{items.findIndex((x) => x.id === it.id) + 1}</span>
                </div>

                <div className="h-32 w-full rounded-md border border-neutral-700 flex items-center justify-center overflow-hidden">
                  <img
                    src={it.snapshot_url}
                    className="w-full h-auto object-cover border border-neutral-800 hover:scale-125 transition-all duration-300 ease-in-out"
                    alt="Vehicle"
                  />
                </div>

                <div className="h-[1px] w-full border-t border-neutral-700 mt-2" />

                <div className="flex flex-col gap-2 w-full">
                  <InfoRow label="Video" value={it.video_title || "—"} />
                  <InfoRow label="Camera" value={it.camera_code || it.camera_label || "—"} />
                  <InfoRow label="Display ID" value={it.display_id || "—"} />
                  <InfoRow
                    label="Recorded"
                    value={it.recorded_at ? new Date(it.recorded_at).toLocaleString() : "—"}
                  />
                  <InfoRow
                    label="Detected"
                    value={it.detected_at ? new Date(it.detected_at).toLocaleString() : "—"}
                  />

                  <div className="h-16 w-full rounded-md border border-neutral-700 flex items-center justify-center overflow-hidden">
                    {it.plate_url ? (
                      <img
                        src={it.plate_url}
                        className="w-full h-auto object-cover border border-neutral-800 hover:scale-125 transition-all duration-300 ease-in-out"
                        alt="Plate"
                      />
                    ) : (
                      <p className="text-[10px] text-neutral-400">NO IMAGE</p>
                    )}
                  </div>

                  <div className="h-[1px] w-full border-t border-neutral-700" />
                  <p className="text-xs text-center text-orange-500">{it.plate_text || "-"}</p>
                </div>



              </div>


            ))}



            <Button className="w-full" onClick={gotoReport}>
              Generate Technical Report
            </Button>
            {items.length > 0 && (
              <Button variant="outline" className="w-full" onClick={() => clearTimeline(wid)}>
                Clear Timeline
              </Button>
            )}
          </div>
        </div>



      </SheetContent>
    </Sheet>
  )
}

function InfoRow({ label, value, colorClass = "text-white" }) {
  return (
    <>
      <div className="flex flex-row justify-between items-center">
        <p className="text-xs text-neutral-400">{label}</p>
        <p className={`text-xs ${colorClass}`}>{value}</p>
      </div>
      <div className="h-[1px] w-full border-t border-neutral-700" />
    </>
  )
}
