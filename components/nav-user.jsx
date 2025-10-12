"use client"

import * as React from "react"
import {
  ChevronsUpDown,
  CircleUserRound,
  LogOut,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

function initialsFrom(name = "", email = "") {
  const n = (name || "").trim()
  if (n) {
    const parts = n.split(/\s+/)
    const first = parts[0]?.[0] || ""
    const last = parts[parts.length - 1]?.[0] || ""
    return (first + last || first || "?").toUpperCase()
  }
  return (email?.[0] || "?").toUpperCase()
}

export function NavUser({ user }) {
  const { isMobile } = useSidebar()

  // ✅ Guard against undefined user
  const safeUser = React.useMemo(
    () =>
      user && typeof user === "object"
        ? user
        : { name: "Guest", email: "", avatar: "" },
    [user]
  )
  const initials = initialsFrom(safeUser.name, safeUser.email)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  // if empty string, Avatar falls back automatically
                  src={safeUser.avatar || undefined}
                  alt={safeUser.name || "User avatar"}
                />
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {safeUser.name || "Guest"}
                </span>
                <span className="truncate text-xs">
                  {safeUser.email || ""}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={safeUser.avatar || undefined}
                    alt={safeUser.name || "User avatar"}
                  />
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {safeUser.name || "Guest"}
                  </span>
                  <span className="truncate text-xs">
                    {safeUser.email || ""}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem>
                <CircleUserRound />
                Account
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem disabled={!user}>
              {/* Disable logout for guest */}
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
