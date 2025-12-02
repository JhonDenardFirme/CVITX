// app/w/[workspaceId]/dashboard/page.jsx
'use client'

/*
  Dashboard Playback Page
  -----------------------
  Purpose:
    Hub page composing the Playback player (left), a summary counter (right),
    and a bottom panel that switches among analytics and utilities.

  Alignment changes in this rewrite:
    - Header enrichment is now *param-aware*:
      If the store's currentWorkspace is empty on first mount, we fall back to
      the route param (workspaceId) and try to resolve details from `workspaces`.
    - All other behaviors remain source-of-truth in their respective modules:
      • FootagePlayback: owns playbackMode ('all' | 'video') and signed URLs.
      • DetectionCounter / IndexingRecords / etc.: read playback scope from the store.

  No props are passed to child modules by design—modules discover data via the store.
*/

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useAppStore } from '@/lib/store'

// Modules
import FootagePlayback from '@/components/modules/FootagePlayback'
import FootageUpload from '@/components/modules/FootageUpload'
import VehicleDetection from '@/components/modules/VehicleDetection'
import IndexingRecords from '@/components/modules/IndexingRecords'
import TechnicalWriter from '@/components/modules/TechnicalWriter'
import DetectionSummary from '@/components/modules/DetectionSummary'
import GraphSummary from '@/components/modules/GraphSummary'
import DetectionCounter from '@/components/modules/DetectionCounter'

// UI
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar' // Only the trigger; no Provider/Inset here

export default function Page() {
  // Panel & record selection (unchanged)
  const activePanel = useAppStore((s) => s.activePanel)
  const setActivePanel = useAppStore((s) => s.setActivePanel)
  const selectedRecordId = useAppStore((s) => s.selectedRecordId)
  const setSelectedRecordId = useAppStore((s) => s.setSelectedRecordId)

  // Workspace context from store
  const current = useAppStore((s) => s.currentWorkspace)
  const all = useAppStore((s) => s.workspaces)

  // Route params fallback for header enrichment
  const params = useParams()
  const widFromParams = params?.workspaceId

  // Enriched header data with param-aware fallback
  const enriched = useMemo(() => {
    // Prefer store.currentWorkspace if it has an id
    const primaryId = current?.id || null

    // If store is empty on first mount, try to resolve via route param
    const resolvedId = primaryId || (typeof widFromParams === 'string' ? widFromParams : null)

    // Try to find a matching workspace in the cached list
    const match = resolvedId && Array.isArray(all) ? all.find(w => w.id === resolvedId) : null

    // Compose final fields with a strict fallback to '-'
    const code = (current?.code || match?.code || '-') || '-'
    const title = (current?.title || match?.title || '-') || '-'
    const description = (current?.description || match?.description || '-') || '-'

    return { code, title, description }
  }, [current, all, widFromParams])

  return (
    <>
      {/* Header (mirrors Footage Upload structure/styles) */}
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
                <BreadcrumbPage>Playback</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-col gap-4 justify-center items-center p-8">
        <div className="flex flex-row justify-center items-center w-full gap-4">
          <div className="flex-[6] h-[75vh] rounded-xl bg-neutral-900">
            <FootagePlayback />
          </div>
          <div className="flex-[4] h-[75vh] rounded-xl bg-neutral-900">
            <DetectionCounter />
          </div>
        </div>

        {/* Bottom panel */}
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
