"use client"

import { useMemo } from 'react'
import { useAppStore } from '@/lib/store'

// Modules
import FootageUpload from '@/components/modules/FootageUpload'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { EvervaultCard, Icon } from '@/components/ui/evervault-card'

export default function Page() {
  const current = useAppStore(s => s.currentWorkspace)
  const all = useAppStore(s => s.workspaces)

  const enriched = useMemo(() => {
    if (!current?.id) return { code: "-", title: "-", description: "-" }
    const match = Array.isArray(all) ? all.find(w => w.id === current.id) : null
    return {
      code: (current.code || match?.code || "-") || "-",
      title: (current.title || match?.title || "-") || "-",
      description: (current.description || match?.description || "-") || "-",
    }
  }, [current, all])

  return (
    <>
      {/* Header */}
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
                <BreadcrumbPage>Footage Upload</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col gap-4 justify-center items-center p-8">
        <div className="flex flex-row justify-center items-center w-full gap-4">
          <div className="border border-black/[0.2] dark:border-white/[0.2] flex flex-row items-start gap-4 p-4 relative w-full h-64 -mx-2 mb-4">
            <Icon className="absolute h-6 w-6 -top-3 -left-3 dark:text-white text-black" />
            <Icon className="absolute h-6 w-6 -bottom-3 -left-3 dark:text-white text-black" />
            <Icon className="absolute h-6 w-6 -top-3 -right-3 dark:text-white text-black" />
            <Icon className="absolute h-6 w-6 -bottom-3 -right-3 dark:text-white text-black" />

            <EvervaultCard text={enriched.code || "-"} />

            <div className="w-full h-full flex flex-col items-center justify-center">
              <h2 className="dark:text-white text-black mt-4 text-base font-medium text-center">
                {enriched.title || "-"}
              </h2>
              <p className="text-xs border font-light dark:border-white/[0.2] border-black/[0.2] rounded-full mt-1 text-black dark:text-white px-3 py-1 text-center">
                {enriched.description || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Panel */}
        <div className="w-full rounded-xl bg-neutral-900 h-auto">
          <FootageUpload />
        </div>
      </div>
    </>
  )
}
