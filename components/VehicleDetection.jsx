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

const VehicleDetection = ({ recordId }) => {
  const [record, setRecord] = useState(null)

  useEffect(() => {
    const fetchRecord = async () => {
      const res = await fetch("/data/indexing-records.json")
      const data = await res.json()
      const match = data.find((item) => item.uid === recordId)
      setRecord(match)
    }

    if (recordId) fetchRecord()
  }, [recordId])

  if (!record) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
        <img src="/icons/plus.svg" alt="Add" className="w-5 h-5" />
        <div className="text-sm text text-neutral-400 p-4">
          Add an Index Record
        </div>
      </div>

    )
  }

  const {
    image,
    vehicle_type,
    color,
    make,
    model,
    first_seen,
    last_seen,
    direction,
    plate_image,
    plate_number,
  } = record

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
                <DropdownMenuItem>Add to Tracking Timeline</DropdownMenuItem>
                <DropdownMenuItem>Download</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <p className="text-sm font-medium">
              {color?.toUpperCase() || "Uncategorized"} {make !== "UNCATEGORIZED" ? make : ""}
            </p>
          </div>
          <p className="text-xs text-orange-500">98.6%</p>
        </div>

        {/* Vehicle Image */}
        <div className="h-32 w-full rounded-md border border-neutral-700 flex items-center justify-center overflow-hidden">
          <img
            src={image}
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
            value={`${formatTime(first_seen)} - ${formatTime(last_seen)}`}
          />
          <InfoRow
            label="Direction"
            value={direction.toUpperCase()}
            colorClass="text-green-500"
          />

          <div className="h-16 w-full rounded-md border border-neutral-700 flex items-center justify-center overflow-hidden">
            {plate_image && plate_image !== "NULL" ? (
              <img
                src={plate_image}
                className="w-full h-auto object-cover border border-neutral-800 hover:scale-125 transition-all duration-300 ease-in-out"
                alt="Plate"
              />
            ) : (
              <p className="text-[10px] text-neutral-400">NO IMAGE</p>
            )}
          </div>

          <div className="h-[1px] w-full border-t border-neutral-700"></div>
          <p className="text-xs text-center text-orange-500">
            {plate_number && plate_number !== "NULL" ? plate_number : "-"}
          </p>
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
