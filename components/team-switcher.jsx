// components/team-switcher.jsx
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronsUpDown, Plus, Command } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function TeamSwitcher({ teams = [], activeId = null, onSelect }) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const safeTeams = Array.isArray(teams) ? teams : []

  // Pick active: id match → first non-empty → null
  const pickActive = React.useCallback(() => {
    if (activeId) {
      const m = safeTeams.find((t) => t && t.id && t.id === activeId)
      if (m) return m
    }
    const firstNonEmpty = safeTeams.find((t) => t && t.id)
    return firstNonEmpty || safeTeams[0] || null
  }, [safeTeams, activeId])

  const [activeTeam, setActiveTeam] = React.useState(pickActive())
  React.useEffect(() => {
    setActiveTeam(pickActive())
  }, [pickActive])

  // Fallback card if no workspace at all (rare)
  if (!activeTeam) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="opacity-70 cursor-default" disabled>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Command className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">No workspace</span>
              <span className="truncate text-xs">-</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const Logo = activeTeam.logo || Command
  const labelName = (activeTeam.name || "").trim() || "-"
  const labelCode = (activeTeam.code || "").trim() || "-"

  function handlePick(team) {
    setActiveTeam(team)
    if (onSelect) {
      onSelect(team)
    } else {
      // Default navigation behavior if no onSelect provided:
      if (team?.id) router.push(`/w/${team.id}/dashboard`)
      else router.push("/workspaces")
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{labelName}</span>
                <span className="truncate text-xs">{labelCode}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Workspace
            </DropdownMenuLabel>

            {safeTeams.map((team, index) => {
              const ItemLogo = team.logo || Command
              const name = (team.name || "").trim() || "-"
              const code = (team.code || "").trim() || "-"
              const isEmpty = !team?.id
              return (
                <DropdownMenuItem
                  key={team.id ?? `empty-${index}`}
                  onClick={() => handlePick(team)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <ItemLogo className="size-4 shrink-0" />
                  </div>
                  <div className="flex flex-col">
                    <span className="leading-none">{name}</span>
                    <span className="text-xs text-muted-foreground leading-none mt-1">
                      {code}
                    </span>
                  </div>
                  <DropdownMenuShortcut>
                    {isEmpty ? "Create" : `⌘${index + 1}`}
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
              )
            })}

            <DropdownMenuSeparator />

            <DropdownMenuItem className="gap-2 p-2" onClick={() => handlePick({ id: null })}>
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Add Workspace</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export default TeamSwitcher
