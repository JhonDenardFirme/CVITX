"use client"

import * as React from "react"

import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  MonitorPlay,
  HardDriveUpload,
  ChartBarStacked,
  PanelRightClose,
  FileText
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Jhon Denard Firme",
    email: "jdfirme@cvitx.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Workspace 1",
      logo: GalleryVerticalEnd,
      plan: "CASE ABC-890",
    },
    {
      name: "Workspace 2",
      logo: AudioWaveform,
      plan: "CASE 123-XYZ",
    },
    {
      name: "Workspace 3",
      logo: Command,
      plan: "CASE 654-321",
    },
  ],
  navMain: [
    {
      title: "Playback",
      url: "#",
      icon: MonitorPlay,
      isActive: true,
      items: [
        { title: "Footage Playback", url: "#" },
        { title: "Vehicle Detection", url: "#" },
      ],
    },
    {
      title: "Footage Upload",
      url: "#",
      icon: HardDriveUpload,
    },
    {
      title: "Analytics",
      url: "#",
      icon: ChartBarStacked,
      items: [
        { title: "Detection Summary", url: "#" },
        { title: "Graph Summary", url: "#" },
      ],
    },
    {
      title: "Indexing",
      url: "#",
      icon: PanelRightClose,
    },
    {
      title: "AI Technical Writer",
      url: "#",
      icon: FileText,
    },
  ],
}

export function AppSidebar({ onNavChange, ...props }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} onNavChange={onNavChange} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

