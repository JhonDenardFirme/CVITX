"use client"

import { useEffect, useState } from "react"
import { MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

// Zustand + route params
import { useAppStore } from "@/lib/store"
import { useParams } from "next/navigation"

const VehicleDetection = ({ recordId }) => {
  const [record, setRecord] = useState(null)

  const addToTimeline = useAppStore((s) => s.addToTimeline)
  const currentWorkspace = useAppStore((s) => s.currentWorkspace)
  const params = useParams()
  const wid = currentWorkspace?.id || params?.workspaceId || "default"

  // Fallback mapper (legacy JSON -> API-like object)
  const mapLegacyRow = (r) => ({
    id: r.uid,
    display_id: String(r.uid),
    snapshot_url: r.image,
    plate_url: r.plate_image && r.plate_image !== "NULL" ? r.plate_image : null,
    plate_text: r.plate_number && r.plate_number !== "NULL" ? r.plate_number : "",
    colors: r.color ? [r.color.toUpperCase()] : [],
    make: r.make !== "UNCATEGORIZED" ? r.make : "",
    model: r.model !== "UNCATEGORIZED" ? r.model : "",
    type: r.vehicle_type === "UNCATEGORIZED" ? "" : r.vehicle_type,
    detected_at: r.first_seen,
    direction: r.direction || "",
    // placeholders:
    footage_label: "Footage 1",
    location: "Anonas Street",
  })

  useEffect(() => {
    let ignore = false

    const run = async () => {
      if (!recordId) {
        setRecord(null)
        return
      }

      // Try API first
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL
        const res = await fetch(`${base}/api/detections/${recordId}`, {
          headers: { "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "" },
        })
        if (!res.ok) throw new Error(`API ${res.status}`)
        const data = await res.json()
        if (!ignore) setRecord(data)
        return
      } catch {
        // Fallback to local JSON so UI continues to work
        try {
          const res = await fetch("/data/indexing-records.json")
          const data = await res.json()
          const match = data.find((item) => item.uid === recordId)
          if (!ignore) setRecord(match ? mapLegacyRow(match) : null)
        } catch {
          if (!ignore) setRecord(null)
        }
      }
    }

    run()
    return () => {
      ignore = true
    }
  }, [recordId])

  if (!record) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
        <img src="/icons/plus.svg" alt="Add" className="w-5 h-5" />
        <div className="text-sm text text-neutral-400 p-4">Add an Index Record</div>
      </div>
    )
  }

  const {
    snapshot_url,
    type,
    colors,
    make,
    model,
    detected_at,
    direction,
    plate_url,
    plate_text,
  } = record

  // Normalize to timeline item (API shape)
  function toTimelineItemFromRecord(r) {
    return {
      id: r.id,
      display_id: r.display_id || String(r.id),
      snapshot_url: r.snapshot_url,
      plate_url: r.plate_url || null,
      plate_text: r.plate_text || "",
      colors: r.colors || [],
      make: r.make || "",
      model: r.model || "",
      detected_at: r.detected_at,
      footage_label: r.footage_label || "Footage",
      location: r.location || "",
    }
  }

  return (
    <div className="w-full h-full flex flex-col p-8 items-start justify-start overflow-y-auto scrollbar-none">
      {/* Header */}
      <div className="h-12 w-full rounded-md border border-neutral-700 mb-4 px-4 flex items-center justify-center gap-2">
        <img src="/icons/detection.svg" alt="Vehicle Detection" className="w-5 h-5" />
        <p className="text-xs text-white">Vehicle Detection</p>
      </div>

      {/* Content */}
      <div className="h-full w-full rounded-md border border-neutral-700 p-4 flex flex-col items-center justify-start gap-2">
        {/* Title and Confidence */}
        <div className="w-full flex flex-row justify-between items-center mb-1">
          <div className="flex flex-row items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => addToTimeline(wid, toTimelineItemFromRecord(record))}>
                  Add to Tracking Timeline
                </DropdownMenuItem>
                <DropdownMenuItem>Download</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <p className="text-sm font-medium">
              {(colors?.[0]?.toUpperCase() || "UNCATEGORIZED")} {make || ""}
            </p>
          </div>
          <p className="text-xs text-orange-500">98.6%</p>
        </div>

        {/* Vehicle Image */}
        <div className="h-32 w-full rounded-md border border-neutral-700 flex items-center justify-center overflow-hidden">
          <img
            src={snapshot_url}
            className="w-full h-auto object-cover border border-neutral-800 hover:scale-125 transition-all duration-300 ease-in-out"
            alt="Vehicle"
          />
        </div>

        <div className="h-[1px] w-full border-t border-neutral-700 mt-2"></div>

        {/* Metadata */}
        <div className="flex flex-col gap-2 w-full">
          <InfoRow label="Footage" value="Footage 1" />
          <InfoRow label="Location" value="Anonas Street" />
          <InfoRow
            label="Timestamp"
            value={detected_at ? formatTime(detected_at) : "-"}
          />
          <InfoRow
            label="Direction"
            value={(direction || "").toString().toUpperCase() || "-"}
            colorClass="text-green-500"
          />

          <div className="h-16 w-full rounded-md border border-neutral-700 flex items-center justify-center overflow-hidden">
            {plate_url ? (
              <img
                src={plate_url}
                className="w-full h-auto object-cover border border-neutral-800 hover:scale-125 transition-all duration-300 ease-in-out"
                alt="Plate"
              />
            ) : (
              <p className="text-[10px] text-neutral-400">NO IMAGE</p>
            )}
          </div>

          <div className="h-[1px] w-full border-t border-neutral-700"></div>
          <p className="text-xs text-center text-orange-500">{plate_text || "-"}</p>
        </div>
      </div>
    </div>
  )
}

const InfoRow = ({ label, value, colorClass = "text-white" }) => (
  <>
    <div className="flex flex-row justify-between items-center">
      <p className="text-xs text-neutral-400">{label}</p>
      <p className={`text-xs ${colorClass}`}>{value}</p>
    </div>
    <div className="h-[1px] w-full border-t border-neutral-700"></div>
  </>
)

const formatTime = (isoString) =>
  new Date(isoString).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })

export default VehicleDetection
