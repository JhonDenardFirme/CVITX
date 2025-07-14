"use client"

import { useEffect, useState } from "react"

import FootagePlayback from "@/components/FootagePlayback"
import FootageUpload from "@/components/FootageUpload"
import VehicleDetection from "@/components/VehicleDetection"
import IndexingRecords from "@/components/IndexingRecords"
import TechnicalWriter from "@/components/TechnicalWriter"
import DetectionSummary from "@/components/DetectionSummary"
import GraphSummary from "@/components/GraphSummary"
import { AppSidebar } from "@/components/app-sidebar"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

export default function Page() {
  const [activePanel, setActivePanel] = useState("Indexing")
  const [selectedRecordId, setSelectedRecordId] = useState(null)
  const [timelineRecords, setTimelineRecords] = useState([])

  useEffect(() => {
    const fetchTimelineData = async () => {
      const res = await fetch("/data/indexing-records.json")
      const data = await res.json()
      const filtered = data.filter((item) =>
        [3, 8, 14].includes(item.uid)
      )
      setTimelineRecords(filtered)
    }

    fetchTimelineData()
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar onNavChange={setActivePanel} />

      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">CASE ABC-890 | Car Theft</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Playback</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-col gap-4 justify-center items-center p-8">
          <div className="flex flex-row justify-center items-center w-full gap-4">
            <div className="flex-[6] h-[75vh] rounded-xl bg-neutral-900">
              <FootagePlayback />
            </div>
            <div className="flex-[4] h-[75vh] rounded-xl bg-neutral-900">
              <VehicleDetection recordId={selectedRecordId} />
            </div>
          </div>

          {/* Bottom Panel */}
          <div className="w-full rounded-xl bg-neutral-900 h-auto">
            {activePanel === "Footage Upload" && <FootageUpload />}
            {activePanel === "Indexing" && (
              <IndexingRecords
                onViewRecord={(id) => {
                  setSelectedRecordId(id)
                  setActivePanel("Vehicle Detection")
                }}
              />
            )}
            {activePanel === "AI Technical Writer" && <TechnicalWriter />}
            {activePanel === "Analytics" && (
              <div className="flex flex-col gap-4">
                <DetectionSummary />
                <GraphSummary />
              </div>
            )}
          </div>
        </div>

        {/* Sheet Timeline */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="fixed top-8 right-4 z-50 p-2 rounded-md bg-orange-500 hover:bg-neutral-700"
              title="Open Tracking Timeline"
            >
              <img src="/icons/timeline.svg" alt="Timeline" className="w-6 h-6" />
            </button>
          </SheetTrigger>

          <SheetContent
            side="right"
            className="w-[320px] bg-neutral-900 border-l border-neutral-700"
          >
            <div className="w-full h-full flex flex-col items-start justify-start overflow-y-auto scrollbar-none">
              <div className="h-12 w-full rounded-md border border-neutral-700 mb-4 px-4 flex items-center justify-center gap-2">
                <img src="/icons/detection.svg" alt="Vehicle Detection" className="w-5 h-5" />
                <p className="text-xs text-white">Tracking Timeline</p>
              </div>

              {/* Timeline Records (3 hardcoded) */}
              <div className="flex flex-col w-full items-center justify-center gap-8 px-2">
                {timelineRecords.map((item) => (
                  <div
                    key={item.uid}
                    className="h-full w-full rounded-md border border-neutral-700 p-4 flex flex-col items-center justify-start gap-2"
                  >
                    <div className="w-full flex flex-row justify-between items-center mb-1">
                      <p className="text-sm font-medium capitalize">{item.color} {item.make !== "UNCATEGORIZED" ? item.make : ""}</p>
                      <p className="text-xs text-orange-500">98.6%</p>
                    </div>

                    <div className="h-32 w-full rounded-md border border-neutral-700 flex items-center justify-center overflow-hidden">
                      <img
                        src={item.image}
                        className="w-full h-auto object-cover border border-neutral-800 hover:scale-125 transition-all duration-300 ease-in-out"
                        alt="Vehicle"
                      />
                    </div>

                    <div className="h-[1px] w-full border-t border-neutral-700 mt-2"></div>

                    <div className="flex flex-col gap-2 w-full">
                      <InfoRow label="Footage" value="Footage 1" />
                      <InfoRow label="Location" value="Anonas Street" />
                      <InfoRow
                        label="Timestamp"
                        value={`${formatTime(item.first_seen)} - ${formatTime(item.last_seen)}`}
                      />
                      <InfoRow
                        label="Direction"
                        value={item.direction}
                        colorClass="text-green-500"
                      />
                      <div className="h-16 w-full rounded-md border border-neutral-700 flex items-center justify-center overflow-hidden">
                        {item.plate_image && item.plate_image !== "NULL" ? (
                          <img
                            src={item.plate_image}
                            className="w-full h-auto object-cover border border-neutral-800 hover:scale-125 transition-all duration-300 ease-in-out"
                            alt="Plate"
                          />
                        ) : (
                          <p className="text-[10px] text-neutral-400">NO IMAGE</p>
                        )}
                      </div>
                      <div className="h-[1px] w-full border-t border-neutral-700"></div>
                      <p className="text-xs text-center text-orange-500">
                        {item.plate_number && item.plate_number !== "NULL" ? item.plate_number : "-"}
                      </p>
                    </div>
                  </div>
                ))}
                <Button className="w-full">Generate Technical Report</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </SidebarInset>
    </SidebarProvider>
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

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })
