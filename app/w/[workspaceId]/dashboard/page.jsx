'use client'

import { useMemo } from 'react'
import { useAppStore } from '@/lib/store'

// Modules
import FootagePlayback from '@/components/modules/FootagePlayback'
import FootageUpload from '@/components/modules/FootageUpload'
import VehicleDetection from '@/components/modules/VehicleDetection'
import IndexingRecords from '@/components/modules/IndexingRecords'
import TechnicalWriter from '@/components/modules/TechnicalWriter'
import DetectionSummary from '@/components/modules/DetectionSummary'
import GraphSummary from '@/components/modules/GraphSummary'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar' // <- ONLY the trigger; no Provider/Inset here
import DetectionCounter from '@/components/modules/DetectionCounter'

export default function Page() {
  const activePanel = useAppStore((s) => s.activePanel)
  const setActivePanel = useAppStore((s) => s.setActivePanel)
  const selectedRecordId = useAppStore((s) => s.selectedRecordId)
  const setSelectedRecordId = useAppStore((s) => s.setSelectedRecordId)

  // --- Match Footage Upload breadcrumb enrichment ---
  const current = useAppStore(s => s.currentWorkspace)
  const all = useAppStore(s => s.workspaces)

  const enriched = useMemo(() => {
    if (!current?.id) return { code: '-', title: '-', description: '-' }
    const match = Array.isArray(all) ? all.find(w => w.id === current.id) : null
    return {
      code: (current.code || match?.code || '-') || '-',
      title: (current.title || match?.title || '-') || '-',
      description: (current.description || match?.description || '-') || '-',
    }
  }, [current, all])

  return (
    <>
      {/* Header (same structure/styles as Footage Upload) */}
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">
                  {enriched.code} | {enriched.title}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                {/* Keep this static like Footage Uploads; rename if you prefer a different label */}
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
            <DetectionCounter/>
          </div>
        </div>

        {/* Bottom Panel */}
        <div className="w-full rounded-xl bg-neutral-900 h-auto">
          {activePanel === 'Footage Upload' && <FootageUpload />}

          {activePanel === 'Indexing' && (
            <IndexingRecords
              onViewRecord={(id) => {
                setSelectedRecordId(id)
                setActivePanel('Vehicle Detection')
              }}
            />
          )}

          {activePanel === 'AI Technical Writer' && <TechnicalWriter />}

          {activePanel === 'Analytics' && (
            <div className="flex flex-col gap-4">
              <DetectionSummary />
              <GraphSummary />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
