// components/common/TimelineSheet.jsx
"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";

/* ============================================================================
   Helpers
   ============================================================================ */

/**
 * Extract a readable camera segment from a display ID.
 * Example: "CTX1004-CAM1-0002" -> "CAM1-0002"
 */
function toCamDisplayId(value) {
  const s = String(value ?? "");
  const m = s.match(/(CAM[A-Za-z0-9-]+)/);
  return m ? m[1] : s;
}

/** hh:mm:ss for time-of-day (localized, client-only) */
function fmtHMS(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/** Short date + time, reusing the same time normalization pattern */
function fmtDateTimeLocal(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";

  const date = d.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
  const time = fmtHMS(dateStr);
  return `${date} • ${time}`;
}

/** Mounted-flag hook (avoid hydration mismatch on client-only formatting) */
function useIsMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

/** Helper: update a single workspace's timeline immutably */
function setTimelineForWid(wid, updater) {
  useAppStore.setState((prev) => {
    const current = prev.timeline?.[wid] || [];
    const next = updater(current);
    return { timeline: { ...prev.timeline, [wid]: next } };
  });
}

/* ============================================================================
   TimelineSheet (global Detection Timeline, workspace-scoped)
   ============================================================================ */

export default function TimelineSheet() {
  const {
    timeline,
    removeFromTimeline,
    clearTimeline,
    currentWorkspace,
    setActivePanel,
  } = useAppStore();
  const router = useRouter();

  const wid = currentWorkspace?.id || "default";

  // Read workspace-scoped timeline items as-is (order is user-controlled via drag).
  const items = useMemo(() => {
    const raw = timeline?.[wid] || [];
    if (!Array.isArray(raw)) return [];
    return raw;
  }, [timeline, wid]);

  // Drag state (only inside this sheet)
  const [draggingId, setDraggingId] = useState(null);

  const handleDragStart = useCallback((id) => {
    setDraggingId(id);
  }, []);

  const handleDragOverCard = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  const handleDropOnCard = useCallback(
    (targetId) => {
      if (!draggingId || draggingId === targetId) return;
      const fromIndex = items.findIndex((x) => x.id === draggingId);
      const toIndex = items.findIndex((x) => x.id === targetId);
      if (fromIndex < 0 || toIndex < 0) return;

      const reordered = [...items];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);

      setTimelineForWid(wid, () => reordered);
      setDraggingId(null);
    },
    [draggingId, items, wid]
  );

  function gotoReport() {
    if (currentWorkspace?.id) {
      router.push(`/w/${currentWorkspace.id}/ai-technical-writer`);
    } else {
      setActivePanel("AI Technical Writer");
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="fixed top-8 right-4 z-50 p-2 rounded-md bg-orange-500 hover:bg-neutral-700"
          title="Open Tracking Timeline"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/timeline.svg" alt="Timeline" className="w-6 h-6" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[320px] bg-neutral-900 border-l border-neutral-700"
      >
        <div className="w-full h-full flex flex-col items-start justify-start overflow-y-auto scrollbar-none">
          {/* Header pill */}
          <div className="h-12 w-full rounded-md border border-neutral-700 mb-4 px-4 flex items-center justify-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/detection.svg"
              alt="Vehicle Detection"
              className="w-5 h-5"
            />
            <p className="text-xs text-white">Tracking Timeline</p>
          </div>

          {/* Timeline cards */}
          <div className="flex flex-col w-full items-center justify-start gap-4 px-2 pb-4">
            {items.length === 0 && (
              <p className="text-xs text-neutral-400 mt-4">
                No items yet. Add from Indexing or Vehicle Detection.
              </p>
            )}

            {items.map((it) => (
              <TimelineCard
                key={it.id}
                item={it}
                items={items}
                wid={wid}
                draggingId={draggingId}
                onDragStart={handleDragStart}
                onDragOverCard={handleDragOverCard}
                onDrop={handleDropOnCard}
                onDragEnd={handleDragEnd}
                onRemove={removeFromTimeline}
              />
            ))}

            <Button className="w-full" onClick={gotoReport}>
              Generate Technical Report
            </Button>

            {items.length > 0 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => clearTimeline(wid)}
              >
                Clear Timeline
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ============================================================================
   TimelineCard (per timeline item)
   ============================================================================ */

function TimelineCard({
  item,
  items,
  wid,
  draggingId,
  onDragStart,
  onDragOverCard,
  onDrop,
  onDragEnd,
  onRemove,
}) {
  const isMounted = useIsMounted();

  // Safe alias handling to match normalized timeline items:
  const displayIdRaw = item.display_id || item.displayId || item.id;
  const displayId = toCamDisplayId(displayIdRaw);

  // Normalize primary color label:
  // - supports ["White"] or [{ base: "White", ... }]
  let colorLabel = "";
  if (Array.isArray(item.colors) && item.colors.length > 0) {
    const first = item.colors[0];
    const base =
      typeof first === "string"
        ? first
        : typeof first?.base === "string"
        ? first.base
        : "";

    if (base) {
      colorLabel = base.toUpperCase();
    }
  }

  const makeLabel = item.make || "";
  const modelLabel = item.model || "";

  const videoLabel = item.video_title || item.videoTitle || "—";

  const cameraCode = item.camera_code || item.cameraCode || null;
  const cameraLabel = item.camera_label || item.cameraLabel || null;
  const cameraValue = cameraCode || cameraLabel || "—";

  const recordedRaw = item.recorded_at || item.recordedAt || null;
  const detectedRaw = item.detected_at || item.detectedAt || null;

  const recordedNode = recordedRaw ? (
    <span suppressHydrationWarning>
      {isMounted ? fmtDateTimeLocal(recordedRaw) : ""}
    </span>
  ) : (
    "—"
  );

  const detectedNode = detectedRaw ? (
    <span suppressHydrationWarning>
      {isMounted ? fmtDateTimeLocal(detectedRaw) : ""}
    </span>
  ) : (
    "—"
  );

  const plateImage = item.plate_url || item.plateUrl || null;
  const plateText = item.plate_text || item.plateText || "-";

  const indexLabel =
    items.findIndex((x) => x.id === item.id) >= 0
      ? items.findIndex((x) => x.id === item.id) + 1
      : "-";

  return (
    <div
      draggable
      onDragStart={() => onDragStart(item.id)}
      onDragOver={onDragOverCard}
      onDrop={() => onDrop(item.id)}
      onDragEnd={onDragEnd}
      className={[
        "relative h-full w-full rounded-md border border-neutral-700 p-4",
        "flex flex-col items-center justify-start gap-2",
        "cursor-grab active:cursor-grabbing select-none",
        draggingId === item.id ? "opacity-80 ring-1 ring-orange-500" : "opacity-100",
      ].join(" ")}
      title={displayId}
    >
      {/* tiny absolute remove */}
      <button
        aria-label="Remove"
        title="Remove"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(wid, item.id);
        }}
        className="absolute top-1.5 right-1.5 h-6 w-6 flex items-center justify-center rounded-md text-neutral-400 hover:text-white hover:bg-red-500/20 transition"
      >
        <span className="text-sm leading-none">×</span>
      </button>

      {/* Title row: Color + Make + Model and index */}
      <div className="w-full flex flex-row justify-between items-center mb-1">
        <p className="text-sm font-medium capitalize">
          {colorLabel} {makeLabel} {modelLabel}
        </p>
        <span className="text-[10px] text-neutral-400">#{indexLabel}</span>
      </div>

      {/* Snapshot image */}
      <div className="h-32 w-full rounded-md border border-neutral-700 flex items-center justify-center overflow-hidden">
        {item.snapshot_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.snapshot_url}
            className="w-full h-auto object-cover border border-neutral-800 hover:scale-125 transition-all duration-300 ease-in-out"
            alt="Vehicle"
          />
        ) : (
          <p className="text-[10px] text-neutral-400">NO IMAGE</p>
        )}
      </div>

      <div className="h-[1px] w-full border-t border-neutral-700 mt-2" />

      {/* Info rows */}
      <div className="flex flex-col gap-2 w-full">
        <InfoRow label="Video" value={videoLabel} />
        <InfoRow label="Camera" value={cameraValue} />
        {/* Display ID row removed from visible UI; displayId is kept as card tooltip/title */}
        <InfoRow label="Recorded" value={recordedNode} />
        <InfoRow label="Detected" value={detectedNode} />

        {/* Plate image */}
        <div className="h-16 w-full rounded-md border border-neutral-700 flex items-center justify-center overflow-hidden">
          {plateImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={plateImage}
              className="w-full h-auto object-cover border border-neutral-800 hover:scale-125 transition-all duration-300 ease-in-out"
              alt="Plate"
            />
          ) : (
            <p className="text-[10px] text-neutral-400">NO IMAGE</p>
          )}
        </div>

        <div className="h-[1px] w-full border-t border-neutral-700" />
        <p className="text-xs text-center text-orange-500">{plateText}</p>
      </div>
    </div>
  );
}

/* ============================================================================
   InfoRow
   ============================================================================ */

function InfoRow({ label, value, colorClass = "text-white" }) {
  return (
    <>
      <div className="flex flex-row justify-between items-center">
        <p className="text-xs text-neutral-400">{label}</p>
        <p className={`text-xs ${colorClass}`}>{value}</p>
      </div>
      <div className="h-[1px] w-full border-t border-neutral-700" />
    </>
  );
}
