"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

/* ---------------- helpers ---------------- */

// Normalize paths (strip trailing slash except "/")
function norm(path) {
  if (!path) return "";
  return path !== "/" && path.endsWith("/") ? path.slice(0, -1) : path;
}
function isActive(pathname, href) {
  const p = norm(pathname);
  const h = norm(href);
  if (!h) return false;
  if (p === h) return true;
  // nested: treat deeper paths as active (e.g., /analytics/summary/xyz)
  return p.startsWith(h + "/");
}

// Back-compat mapper (used only for calling your handlers; navigation is via Link)
function mapToPanel(title) {
  if (title === "Detection Summary" || title === "Graph Summary") return "Analytics";
  return title;
}

/* ---------------- leaf item (no children) ---------------- */

function NavLeafItem({ item, pathname, onNavChange }) {
  const ItemIcon = item.icon;
  const href = item.href || null;
  const active = href ? isActive(pathname, href) : false;

  return (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton
        asChild
        tooltip={item.title}
        className={active ? "bg-sidebar-accent text-sidebar-accent-foreground" : undefined}
      >
        {href ? (
          <Link
            href={href}
            onClick={() => onNavChange?.(item.title)}
            className="flex items-center gap-2 w-full text-left"
          >
            {ItemIcon ? <ItemIcon className="w-4 h-4" /> : null}
            <span>{item.title}</span>
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="flex items-center gap-2 w-full text-left opacity-60 cursor-not-allowed"
          >
            {ItemIcon ? <ItemIcon className="w-4 h-4" /> : null}
            <span>{item.title}</span>
          </button>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/* ---------------- group item (has children) ---------------- */
/* NOTE: Hooks live here (not inside map callback) to satisfy rules-of-hooks. */

function NavGroupItem({ item, pathname, onNavChange, onSubItemClick }) {
  const ItemIcon = item.icon;
  const hasChildren = Array.isArray(item.items) && item.items.length > 0;
  const anyChildActive = hasChildren && item.items.some((s) => s.href && isActive(pathname, s.href));

  const [open, setOpen] = React.useState(Boolean(item.isActive) || anyChildActive);

  // Keep the group expanded when URL matches a child
  React.useEffect(() => {
    if (anyChildActive) setOpen(true);
  }, [anyChildActive]);

  if (!hasChildren) {
    return <NavLeafItem item={item} pathname={pathname} onNavChange={onNavChange} />;
  }

  return (
    <Collapsible asChild open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            className={anyChildActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : undefined}
          >
            {ItemIcon ? <ItemIcon className="w-4 h-4" /> : null}
            <span>{item.title}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items.map((subItem) => {
              const SubIcon = subItem.icon;
              const shref = subItem.href || null;
              const subActive = shref ? isActive(pathname, shref) : false;

              return (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton
                    asChild
                    className={subActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : undefined}
                  >
                    {shref ? (
                      <Link
                        href={shref}
                        onClick={() =>
                        (onSubItemClick?.(mapToPanel(subItem.title)) ??
                          onNavChange?.(mapToPanel(subItem.title)))
                        }
                        className="w-full text-left"
                      >
                        {SubIcon ? <SubIcon className="mr-2 h-4 w-4" /> : null}
                        <span>{subItem.title}</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full text-left opacity-60 cursor-not-allowed"
                      >
                        {SubIcon ? <SubIcon className="mr-2 h-4 w-4" /> : null}
                        <span>{subItem.title}</span>
                      </button>
                    )}
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

/* ---------------- main ---------------- */

export function NavMain({
  items = [],          // keep your original API
  onNavChange,         // optional callback
  onSubItemClick,      // optional callback
}) {
  const pathname = usePathname();
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>

      <SidebarMenu>
        {safeItems.map((item) => (
          <NavGroupItem
            key={item.title}
            item={item}
            pathname={pathname}
            onNavChange={onNavChange}
            onSubItemClick={onSubItemClick}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export default NavMain;
