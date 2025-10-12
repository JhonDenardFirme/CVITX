// components/app-sidebar.jsx
"use client";

import * as React from "react";
import Link from "next/link"; // (kept)
import { useParams } from "next/navigation";
import {
  HardDriveUpload,
  PanelRightClose,
  ChartBarStacked,
  FileText,
  GalleryVerticalEnd,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAppStore } from "@/lib/store";
import { useUser } from "@/lib/auth";

/* --- small helper: sort CTX codes ascending --- */
function codeNumber(code) {
  if (!code) return Number.POSITIVE_INFINITY;
  const m = String(code).match(/\d+/);
  return m ? parseInt(m[0], 10) : Number.POSITIVE_INFINITY;
}
function sortByCodeAsc(list) {
  return [...list].sort((a, b) => {
    const na = codeNumber(a?.code);
    const nb = codeNumber(b?.code);
    if (na !== nb) return na - nb;
    return String(a?.code || "").localeCompare(String(b?.code || ""));
  });
}

const MAX_SLOTS = 3; // keep parity with Workspaces page

export function AppSidebar(props) {
  const params = useParams();
  const { user: me } = useUser();
  const currentWorkspace = useAppStore((s) => s.currentWorkspace);

  // NEW (surgical): pull list + setter from store
  const workspaces = useAppStore((s) => s.workspaces);
  const setWorkspaces = useAppStore((s) => s.setWorkspaces);
  const setCurrentWorkspace = useAppStore((s) => s.setCurrentWorkspace);

  const wid =
    currentWorkspace?.id ||
    (typeof params?.workspaceId === "string" ? params.workspaceId : null);

  const base = wid ? `/w/${wid}` : "";

  // NEW (surgical): load ALL workspaces once if store empty
  React.useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        if (Array.isArray(workspaces) && workspaces.length > 0) return;
        const res = await fetch("/api/workspaces", { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const arr = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        setWorkspaces(arr);
      } catch (e) {
        // keep silent; TeamSwitcher will still render with "-" placeholders if you add empties there
        console.warn("[AppSidebar] workspaces fetch:", e?.message || e);
        if (!ignore) setWorkspaces([]);
      }
    })();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only

  // ✅ Use title or "-" (no UUID fallback); pass CTX `code` or "-"
  // CHANGED (surgical): build from list, sorted & capped; fallback to currentWorkspace if list empty
  const teams = React.useMemo(() => {
    const list = Array.isArray(workspaces) && workspaces.length > 0
      ? sortByCodeAsc(workspaces).slice(0, MAX_SLOTS)
      : currentWorkspace
        ? [currentWorkspace]
        : [];

    return list.map((ws) => ({
      id: ws?.id || "default",
      name: (ws?.title || "").trim() || "-",            // <- no UUID fallback
      plan: ws?.plan || "—",
      code: (ws?.code || "").trim() || "-",             // <- CTX#### or "-"
      logo: GalleryVerticalEnd,
      raw: ws,                                          // keep full JSON for onSelect
    }));
  }, [workspaces, currentWorkspace]);

  const navMain = React.useMemo(() => {
    const safe = (p) => (base ? `${base}${p}` : null);
    return [
      { title: "Dashboard", icon: HardDriveUpload, href: safe("/dashboard") },
      { title: "Footage Upload", icon: HardDriveUpload, href: safe("/footage-uploads") },
      { title: "Indexing", icon: PanelRightClose, href: safe("/indexing") },
      {
        title: "Analytics",
        icon: ChartBarStacked,
        items: [
          { title: "Detection Summary", icon: FileText, href: safe("/analytics/summary") },
          { title: "Graph Summary", icon: ChartBarStacked, href: safe("/analytics/graphs") },
        ],
      },
      { title: "AI Technical Writer", icon: FileText, href: safe("/reports/technical-writer") },
    ];
  }, [base]);

  const displayName = React.useMemo(() => {
    if (!me) return "Guest";
    const first = (me.first_name || "").trim();
    const last = (me.last_name || "").trim();
    const full = `${first} ${last}`.trim();
    return full || me.name || me.email || "Guest";
  }, [me]);

  const sidebarUser = React.useMemo(
    () => ({
      name: displayName,
      email: me?.email || "",
      avatar: me?.avatar_s3_key ? "" : "",
    }),
    [displayName, me?.email, me?.avatar_s3_key]
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          teams={teams}
          activeId={currentWorkspace?.id || null}  // highlight current
          onSelect={(team) => {
            // if you render “empty slots” inside TeamSwitcher, handle them there;
            // here we only handle valid selections
            if (!team?.id) {
              window.location.href = "/workspaces";
              return;
            }
            if (team.raw) setCurrentWorkspace(team.raw);
            window.location.href = `/w/${team.id}/dashboard`;
          }}
        />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;
